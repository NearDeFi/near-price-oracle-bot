const near = require("./near");
const config = require("./config");
const bot = require("./bot");
const coingecko = require("./feeds/coingecko");
const binance = require("./feeds/binance");
const binanceFutures = require("./feeds/binance-futures");
const huobi = require("./feeds/huobi");
const { GetMedianPrice } = require("./functions");

console.log("Welcome to the Oracle Bot");

let coins = {
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

const fraction_digits = 4;

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
    const discrepancy_denominator = Math.pow(10, fraction_digits);

    object[ticker] = {
      multiplier: Math.round(price * discrepancy_denominator),
      decimals: coins[ticker].decimals + fraction_digits,
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

main();
