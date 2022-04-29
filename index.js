const near = require("./near");
const config = require("./config");
const bot = require("./bot");
const coingecko = require("./feeds/coingecko");
const binance = require("./feeds/binance");
const binanceFutures = require("./feeds/binance-futures");
const huobi = require("./feeds/huobi");
const cryptocom = require("./feeds/crypto.com");
const ftx = require("./feeds/ftx");
const kucoin = require("./feeds/kucoin");
const gate = require("./feeds/gate");
const { GetMedianPrice, LoadJson, SaveJson } = require("./functions");

console.log("Welcome to the Oracle Bot");

const nearConfig = config.getConfig(process.env.NODE_ENV || "development");

const TestnetCoins = {
  "wrap.testnet": {
    decimals: 24,
    coingecko: "near",
    binance: "NEARUSDT",
    huobi: "nearusdt",
    ftx: "NEAR/USD",
    cryptocom: "NEAR_USDT",
    kucoin: "NEAR-USDT",
    gate: "near_usdt",
  },
  aurora: {
    decimals: 18,
    coingecko: "ethereum",
    binance: "ETHUSDT",
    huobi: "ethusdt",
    ftx: "ETH/USD",
    cryptocom: "ETH_USDT",
    kucoin: "ETH-USDT",
    gate: "eth_usdt",
  },
  "usdt.fakes.testnet": {
    decimals: 6,
    stablecoin: true,
    coingecko: "tether",
    ftx: "USDT/USD",
    gate: "usdt_usd",
  },
  "usdc.fakes.testnet": {
    decimals: 6,
    stablecoin: true,
    coingecko: "usd-coin",
    cryptocom: "USDC_USDT",
    kucoin: "USDC-USDT",
  },
  "dai.fakes.testnet": {
    decimals: 18,
    stablecoin: true,
    coingecko: "dai",
    huobi: "daiusdt",
    ftx: "DAI/USD",
    cryptocom: "DAI_USDT",
    gate: "dai_usdt",
  },
  "wbtc.fakes.testnet": {
    decimals: 8,
    coingecko: "wrapped-bitcoin",
    binance: "BTCUSDT",
    huobi: "btcusdt",
    ftx: "BTC/USD",
    cryptocom: "BTC_USDT",
    kucoin: "BTC-USDT",
    gate: "btc_usdt",
  },
  "aurora.fakes.testnet": {
    decimals: 18,
    coingecko: "aurora-near",
    cryptocom: "AURORA_USDT",
    huobi: "aurorausdt",
    kucoin: "AURORA-USDT",
    gate: "aurora_usdt",
  },
};

const MainnetCoins = {
  "wrap.near": {
    decimals: 24,
    coingecko: "near",
    binance: "NEARUSDT",
    huobi: "nearusdt",
    ftx: "NEAR/USD",
    cryptocom: "NEAR_USDT",
    kucoin: "NEAR-USDT",
    gate: "near_usdt",
  },
  aurora: {
    decimals: 18,
    coingecko: "ethereum",
    binance: "ETHUSDT",
    huobi: "ethusdt",
    ftx: "ETH/USD",
    cryptocom: "ETH_USDT",
    kucoin: "ETH-USDT",
    gate: "eth_usdt",
  },
  "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near": {
    decimals: 6,
    stablecoin: true,
    coingecko: "tether",
    ftx: "USDT/USD",
    gate: "usdt_usd",
  },
  "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near": {
    decimals: 6,
    stablecoin: true,
    coingecko: "usd-coin",
    cryptocom: "USDC_USDT",
    kucoin: "USDC-USDT",
  },
  "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near": {
    decimals: 18,
    stablecoin: true,
    coingecko: "dai",
    huobi: "daiusdt",
    ftx: "DAI/USD",
    cryptocom: "DAI_USDT",
    gate: "dai_usdt",
  },
  "2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near": {
    decimals: 8,
    coingecko: "wrapped-bitcoin",
    binance: "BTCUSDT",
    huobi: "btcusdt",
    ftx: "BTC/USD",
    cryptocom: "BTC_USDT",
    kucoin: "BTC-USDT",
    gate: "btc_usdt",
  },
  /*
  "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near": {
    decimals: 18,
    coingecko: "aurora-near",
    cryptocom: "AURORA_USDT",
    huobi: "aurorausdt",
    kucoin: "AURORA-USDT",
    gate: "aurora_usdt",
  }
   */
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
        // TODO: Update 1.25 in about 1 year (May, 2023)
        if (stNearMultiplier < 1.0 || stNearMultiplier > 1.25) {
          console.error("stNearMultiplier is out of range:", stNearMultiplier);
          return null;
        }
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
  "usdn.testnet": {
    dependencyCoin: "usdt.fakes.testnet",
    computeCall: async (dependencyPrice) => {
      if (!dependencyPrice) {
        return null;
      }
      try {
        const rawStablePool = await near.NearView(
          "ref-finance-101.testnet",
          "get_stable_pool",
          { pool_id: 356 }
        );
        const relDiff =
          parseFloat(rawStablePool.c_amounts[0]) /
          parseFloat(rawStablePool.c_amounts[1]);
        if (
          relDiff < 0.99 ||
          relDiff > 1.01 ||
          parseFloat(rawStablePool.c_amounts[0]) < 900000 * 1e18
        ) {
          console.error("USN stable pool is unbalanced");
          return null;
        }
        return {
          multiplier: dependencyPrice.multiplier,
          decimals: dependencyPrice.decimals + 12,
        };
      } catch (e) {
        console.log(e);
        return null;
      }
    },
  },
};

const mainnet = nearConfig.networkId === "mainnet";
const coins = mainnet ? MainnetCoins : TestnetCoins;
const computeCoins = mainnet ? MainnetComputeCoins : TestnetComputeCoins;

const DefaultState = {
  lastFullUpdateTimestamp: 0,
};

async function main() {
  const state = Object.assign(
    DefaultState,
    LoadJson(config.STATE_FILENAME) || {}
  );

  const values = await Promise.all([
    binance.getPrices(coins),
    coingecko.getPrices(coins),
    binanceFutures.getPrices(coins),
    huobi.getPrices(coins),
    ftx.getPrices(coins),
    cryptocom.getPrices(coins),
    kucoin.getPrices(coins),
    gate.getPrices(coins),
  ]);

  const new_prices = Object.keys(coins).reduce((object, ticker) => {
    let price = GetMedianPrice(values, ticker);
    const discrepancy_denominator = Math.pow(10, config.FRACTION_DIGITS);

    // Since stable coins rely only on coingecko price, to prevent further risks, we limit the range.
    if (coins[ticker].stablecoin && price > 0) {
      if (price < 0.95 || price > 1.05) {
        console.error(
          `Stablecoin price of ${ticker} is out of range: ${price}`
        );
        price = 0;
      }
    }

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

  await bot.updatePrices(tickers, old_prices, new_prices, state);

  SaveJson(state, config.STATE_FILENAME);
}

setTimeout(() => {
  process.exit(1);
}, config.REPORT_TIMEOUT);

main().then(() => {
  process.exit(0);
});
