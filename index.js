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
  aurora: {
    decimals: 18,
    coingecko: "ethereum",
    binance: "ETHUSDT",
    huobi: "ethusdt",
  },
  "usdt.fakes.testnet": { decimals: 6, coingecko: "tether" },
  "usdc.fakes.testnet": {
    decimals: 6,
    coingecko: "usd-coin",
    binance: "USDCUSDT",
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
  aurora: {
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
    binance: "USDCUSDT",
    huobi: "usdcusdt",
  },
  "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near": {
    decimals: 18,
    coingecko: "dai",
    huobi: "daiusdt",
  },
  "2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near": {
    decimals: 8,
    coingecko: "wbtc",
    binance: "BTCUSDT",
    huobi: "btcusdt",
  },
};

const MainnetComputeCoins = {
  "c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near": {
    dependencyCoin: "aurora",
    computeCall: async (dependencyPrice) => dependencyPrice,
  },
  "meta-pool.near": {
    dependencyCoin: "wrap.near",
    computeCall: async (dependencyPrice) => {
      if (!dependencyPrice) {
        return null;
      }
      try {
        const rawStNearState = await near.NearView(
          "meta-pool.near",
          "get_contract_state",
          {}
        );
        const stNearMultiplier =
          parseFloat(rawStNearState.st_near_price) / 1e24;
        return {
          multiplier: Math.round(dependencyPrice.multiplier * stNearMultiplier),
          decimals: dependencyPrice.decimals,
        };
      } catch (e) {
        console.log(e);
        return null;
      }
    },
  },
};

const TestnetComputeCoins = {
  "weth.fakes.testnet": {
    dependencyCoin: "aurora",
    computeCall: async (dependencyPrice) => dependencyPrice,
  },
};

const mainnet = nearConfig.networkId === "mainnet";
const coins = mainnet ? MainnetCoins : TestnetCoins;
const computeCoins = mainnet ? MainnetComputeCoins : TestnetComputeCoins;

async function main() {
  const values = await Promise.all([
    binance.getPrices(coins),
    coingecko.getPrices(coins),
    binanceFutures.getPrices(coins),
    huobi.getPrices(coins),
  ]);
  const new_prices = Object.keys(coins).reduce((object, ticker) => {
    let price = GetMedianPrice(values, ticker);
    const discrepancy_denominator = Math.pow(10, config.FRACTION_DIGITS);

    object[ticker] = {
      multiplier: Math.round(price * discrepancy_denominator),
      decimals: coins[ticker].decimals + config.FRACTION_DIGITS,
    };
    return object;
  }, {});

  await Promise.all(
    Object.entries(computeCoins).map(
      ([key, { dependencyCoin, computeCall }]) => {
        return (async () => {
          new_prices[key] = await computeCall(new_prices[dependencyCoin]);
        })();
      }
    )
  );

  const tickers = Object.keys(coins).concat(Object.keys(computeCoins));

  const raw_oracle_price_data = await near.NearView(
    config.CONTRACT_ID,
    "get_oracle_price_data",
    {
      account_id: config.NEAR_ACCOUNT_ID,
      asset_ids: tickers,
      recency_duration_sec: Math.floor(config.MAX_NO_REPORT_DURATION / 1000),
    }
  );

  const old_prices = raw_oracle_price_data.prices.reduce(
    (obj, item) =>
      Object.assign(obj, {
        [item.asset_id]: item.price
          ? { multiplier: item.price.multiplier, decimals: item.price.decimals }
          : { multiplier: 0, decimals: 0 },
      }),
    {}
  );

  await bot.updatePrices(tickers, old_prices, new_prices);
}

setTimeout(() => {
  process.exit(1);
}, config.REPORT_TIMEOUT);

main().then(() => {
  process.exit(0);
});
