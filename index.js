const near = require("./near");
const config = require("./config");
const bot = require("./bot");
const coingecko = require("./feeds/coingecko");
const binance = require("./feeds/binance");
const binanceFutures = require("./feeds/binance-futures");
const huobi = require("./feeds/huobi");
const { GetMedianPrice } = require("./functions");

console.log("Welcome to the Oracle Bot");

const nearConfig = config.getConfig(process.env.NODE_ENV || "development");

const TestnetCoins = {
  "wrap.testnet": {
    decimals: 24,
    coingecko: "near",
    binance: "NEARUSDT",
    huobi: "nearusdt",
  },
  "weth.fakes.testnet": {
    decimals: 18,
    coingecko: "ethereum",
    binance: "ETHUSDT",
    huobi: "ethusdt",
  },
  "usdt.fakes.testnet": { decimals: 6, coingecko: "tether" },
  "usdc.fakes.testnet": {
    decimals: 6,
    coingecko: "usd-coin",
    huobi: "usdcusdt",
  },
  "dai.fakes.testnet": { decimals: 18, coingecko: "dai", huobi: "daiusdt" },
};

const MainnetCoins = {
  "wrap.near": {
    decimals: 24,
    coingecko: "near",
    binance: "NEARUSDT",
    huobi: "nearusdt",
  },
  "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near": {
    decimals: 18,
    coingecko: "ethereum",
    binance: "ETHUSDT",
    huobi: "ethusdt",
  },
  "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near": {
    decimals: 6,
    coingecko: "tether",
  },
  "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near": {
    decimals: 6,
    coingecko: "usd-coin",
    huobi: "usdcusdt",
  },
  "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near": {
    decimals: 18,
    coingecko: "dai",
    huobi: "daiusdt",
  },
};

const coins = nearConfig.networkId === "mainnet" ? MainnetCoins : TestnetCoins;

async function main() {
  const values = await Promise.all([
    binance.getPrices(coins),
    coingecko.getPrices(coins),
    binanceFutures.getPrices(coins),
    huobi.getPrices(coins),
  ]);
  const tickers = Object.keys(coins);
  const new_prices = tickers.reduce((object, ticker) => {
    let price = GetMedianPrice(values, ticker);
    const discrepancy_denominator = Math.pow(10, config.FRACTION_DIGITS);

    object[ticker] = {
      multiplier: Math.round(price * discrepancy_denominator),
      decimals: coins[ticker].decimals + config.FRACTION_DIGITS,
    };
    return object;
  }, {});

  const [raw_oracle_price_data, raw_oracle] = await Promise.all([
    near.NearView(config.CONTRACT_ID, "get_oracle_price_data", {
      account_id: config.NEAR_ACCOUNT_ID,
      asset_ids: tickers,
    }),
    near.NearView(config.CONTRACT_ID, "get_oracle", {
      account_id: config.NEAR_ACCOUNT_ID,
    }),
  ]);

  const old_prices = raw_oracle_price_data.prices.reduce(
    (obj, item) =>
      Object.assign(obj, {
        [item.asset_id]: item.price
          ? { multiplier: item.price.multiplier, decimals: item.price.decimals }
          : { multiplier: 0, decimals: 0 },
      }),
    {}
  );
  const last_report = parseFloat(raw_oracle.last_report) / 1e6;

  await bot.updatePrices(tickers, old_prices, new_prices, last_report);
}

setTimeout(() => {
  process.exit(1);
}, config.REPORT_TIMEOUT);

main().then(() => {
  process.exit(0);
});
