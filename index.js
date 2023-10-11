const near = require("./near");
const config = require("./config");
const bot = require("./bot");
const coingecko = require("./feeds/coingecko");
const binance = require("./feeds/binance");
const binanceFutures = require("./feeds/binance-futures");
const huobi = require("./feeds/huobi");
const cryptocom = require("./feeds/crypto.com");
const kucoin = require("./feeds/kucoin");
const gate = require("./feeds/gate");
const chainlink = require("./feeds/chainlink");
const refExchange = require("./feeds/refExchange");
const { GetMedianPrice, LoadJson, SaveJson } = require("./functions");
const pjson = require('./package.json');

console.log(`NEAR Price Oracle Validator Bot, v.${pjson?.version}`);

const nearConfig = config.getConfig(process.env.NODE_ENV || "development");

const TestnetCoins = {
  "wrap.testnet": {
    decimals: 24,
    coingecko: "near",
    binance: "NEARUSDT",
    huobi: "nearusdt",
    cryptocom: "NEAR_USDT",
    kucoin: "NEAR-USDT",
    gate: "near_usdt",
    chainlink: "0xC12A6d1D827e23318266Ef16Ba6F397F2F91dA9b"
  },
  aurora: {
    decimals: 18,
    coingecko: "ethereum",
    binance: "ETHUSDT",
    huobi: "ethusdt",
    cryptocom: "ETH_USDT",
    kucoin: "ETH-USDT",
    gate: "eth_usdt",
    chainlink: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    fractionDigits: 2
  },
  "usdt.fakes.testnet": {
    decimals: 6,
    stablecoin: true,
    coingecko: "tether",
    gate: "usdt_usd",
    chainlink: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D"
  },
  "usdc.fakes.testnet": {
    decimals: 6,
    stablecoin: true,
    coingecko: "usd-coin",
    cryptocom: "USDC_USDT",
    kucoin: "USDC-USDT",
    binance: "USDCUSDT",
    chainlink: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6"
  },
  "dai.fakes.testnet": {
    decimals: 18,
    stablecoin: true,
    coingecko: "dai",
    huobi: "daiusdt",
    cryptocom: "DAI_USDT",
    gate: "dai_usdt",
    binance: "DAIUSDT",
    chainlink: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"
  },
  "wbtc.fakes.testnet": {
    decimals: 8,
    coingecko: "wrapped-bitcoin",
    binance: "BTCUSDT",
    huobi: "btcusdt",
    cryptocom: "BTC_USDT",
    kucoin: "BTC-USDT",
    gate: "btc_usdt",
    chainlink: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    fractionDigits: 2
  },
  "aurora.fakes.testnet": {
    decimals: 18,
    coingecko: "aurora-near",
    cryptocom: "AURORA_USDT",
    huobi: "aurorausdt",
    kucoin: "AURORA-USDT",
    gate: "aurora_usdt",
    relativeDiff: 0.01, // 1%
    fractionDigits: 5
  },
  "woo.orderly.testnet": {
    decimals: 18,
    coingecko: "woo-network",
    binance: "WOOUSDT",
    huobi: "woousdt",
    cryptocom: "WOO_USDT",
    kucoin: "WOO-USDT",
    gate: "woo_usdt",
    relativeDiff: 0.01, // 1%
    fractionDigits: 6
  }
};

const MainnetCoins = {
  "wrap.near": {
    decimals: 24,
    coingecko: "near",
    binance: "NEARUSDT",
    huobi: "nearusdt",
    cryptocom: "NEAR_USDT",
    kucoin: "NEAR-USDT",
    gate: "near_usdt",
    chainlink: "0xC12A6d1D827e23318266Ef16Ba6F397F2F91dA9b"
  },
  aurora: {
    decimals: 18,
    coingecko: "ethereum",
    binance: "ETHUSDT",
    huobi: "ethusdt",
    cryptocom: "ETH_USDT",
    kucoin: "ETH-USDT",
    gate: "eth_usdt",
    chainlink: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    fractionDigits: 2
  },
  "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near": {
    decimals: 6,
    stablecoin: true,
    coingecko: "tether",
    gate: "usdt_usd",
    chainlink: "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D"
  },
  "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near": {
    decimals: 6,
    stablecoin: true,
    coingecko: "usd-coin",
    cryptocom: "USDC_USDT",
    kucoin: "USDC-USDT",
    binance: "USDCUSDT",
    chainlink: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6"
  },
  "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near": {
    decimals: 18,
    stablecoin: true,
    coingecko: "dai",
    huobi: "daiusdt",
    cryptocom: "DAI_USDT",
    gate: "dai_usdt",
    binance: "DAIUSDT",
    chainlink: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"
  },
  "2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near": {
    decimals: 8,
    coingecko: "wrapped-bitcoin",
    binance: "BTCUSDT",
    huobi: "btcusdt",
    cryptocom: "BTC_USDT",
    kucoin: "BTC-USDT",
    gate: "btc_usdt",
    chainlink: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
    fractionDigits: 2
  },
  "aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near": {
    decimals: 18,
    coingecko: "aurora-near",
    cryptocom: "AURORA_USDT",
    huobi: "aurorausdt",
    kucoin: "AURORA-USDT",
    gate: "aurora_usdt",
    relativeDiff: 0.01, // 1%
    fractionDigits: 5
  },
  "4691937a7508860f876c9c0a2a617e7d9e945d4b.factory.bridge.near": {
    decimals: 18,
    coingecko: "woo-network",
    binance: "WOOUSDT",
    huobi: "woousdt",
    cryptocom: "WOO_USDT",
    kucoin: "WOO-USDT",
    gate: "woo_usdt",
    relativeDiff: 0.01, // 1%
    fractionDigits: 6
  }
};

const computeUsn = (usnTokenId, usdtTokenId, stablePoolId) => {
  return {
    dependencyCoin: usdtTokenId,
    computeCall: async (dependencyPrice) => {
      if (!dependencyPrice) {
        return null;
      }
      try {
        const usnPriceMultiplier = await refExchange.computeUsnPriceMultiplier(
          near,
          usnTokenId,
          usdtTokenId,
          stablePoolId
        );
        return usnPriceMultiplier
          ? {
              multiplier: Math.round(
                dependencyPrice.multiplier * usnPriceMultiplier
              ),
              decimals: dependencyPrice.decimals + 12,
            }
          : null;
      } catch (e) {
        console.log(e);
        return null;
      }
    },
  };
};

const MainnetComputeCoins = {
  "meta-pool.near": {
    dependencyCoin: "wrap.near",
    computeCall: async (dependencyPrice) => {
      if (!dependencyPrice) {
        return null;
      }
      try {
        const metadata = await near.NearView(
          "meta-pool.near",
          "ft_metadata",
          {}
        );
        if (metadata.decimals !== 24) {
          return null;
        }
        const rawStNearState = await near.NearView(
          "meta-pool.near",
          "get_contract_state",
          {}
        );
        const stNearMultiplier =
          parseFloat(rawStNearState.st_near_price) / 1e24;
        // TODO: Update 1.34 in about 1 year (Jul, 2024)
        if (stNearMultiplier < 1.21 || stNearMultiplier > 1.34) {
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
  "linear-protocol.near": {
    dependencyCoin: "wrap.near",
    computeCall: async (dependencyPrice) => {
      if (!dependencyPrice) {
        return null;
      }
      try {
        const rawLiNearPrice = await near.NearView(
          "linear-protocol.near",
          "ft_price",
          {}
        );
        const liNearMultiplier = parseFloat(rawLiNearPrice) / 1e24;
        // TODO: Update 1.25 in about 1 year (July, 2024)
        if (liNearMultiplier < 1.13 || liNearMultiplier > 1.25) {
          console.error("liNearMultiplier is out of range:", liNearMultiplier);
          return null;
        }
        return {
          multiplier: Math.round(dependencyPrice.multiplier * liNearMultiplier),
          decimals: dependencyPrice.decimals,
        };
      } catch (e) {
        console.log(e);
        return null;
      }
    },
  },
  "v2-nearx.stader-labs.near": {
    dependencyCoin: "wrap.near",
    computeCall: async (dependencyPrice) => {
      if (!dependencyPrice) {
        return null;
      }
      try {
        const nearXPrice = await near.NearView(
            "v2-nearx.stader-labs.near",
            "get_nearx_price",
            {}
        );
        const nearXMultiplier = parseFloat(nearXPrice) / 1e24;
        // TODO: Update 1.25 in about 1 year (July, 2024)
        if (nearXMultiplier < 1.13 || nearXMultiplier > 1.25) {
          console.error("nearXMultiplier is out of range:", nearXMultiplier);
          return null;
        }
        return {
          multiplier: Math.round(dependencyPrice.multiplier * nearXMultiplier),
          decimals: dependencyPrice.decimals,
        };
      } catch (e) {
        console.log(e);
        return null;
      }
    },
  },
  usn: computeUsn(
    "usn",
    "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near",
    3020
  ),
  "usdt.tether-token.near": {
    dependencyCoin: "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near",
    computeCall: async (dependencyPrice) => dependencyPrice,
  },
  "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1": {
    dependencyCoin: "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near",
    computeCall: async (dependencyPrice) => dependencyPrice,
  }
};

const TestnetComputeCoins = {
  "weth.fakes.testnet": {
    dependencyCoin: "aurora",
    computeCall: async (dependencyPrice) => dependencyPrice,
  },
  "usdn.testnet": computeUsn("usdn.testnet", "usdt.fakes.testnet", 356),
  "3e2210e1184b45b64c8a434c0a7e7b23cc04ea7eb7a6c3c32520d03d4afcb8af": {
    dependencyCoin: "usdc.fakes.testnet",
    computeCall: async (dependencyPrice) => dependencyPrice,
  }
};

const mainnet = nearConfig.networkId === "mainnet";
const coins = mainnet ? MainnetCoins : TestnetCoins;
const computeCoins = mainnet ? MainnetComputeCoins : TestnetComputeCoins;

const DefaultState = {
  lastFullUpdateTimestamp: 0,
  lastVersionReportTimestamp: 0,
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
    cryptocom.getPrices(coins),
    kucoin.getPrices(coins),
    gate.getPrices(coins),
    chainlink.getPrices(coins),
  ]);

  const new_prices = Object.keys(coins).reduce((object, ticker) => {
    let price = GetMedianPrice(values, ticker);
    coins[ticker].fractionDigits = coins[ticker].fractionDigits || config.FRACTION_DIGITS;

    const discrepancy_denominator = Math.pow(10, coins[ticker].fractionDigits);

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
      decimals: coins[ticker].decimals + coins[ticker].fractionDigits,
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

  // console.log(JSON.stringify(new_prices, null, 2));

  const tickers = Object.keys(coins).concat(Object.keys(computeCoins));
  const relativeDiffs = tickers.reduce((agg, ticker) => {
    agg[ticker] =
      coins[ticker]?.relativeDiff ||
      computeCoins[ticker]?.relativeDiff ||
      config.RELATIVE_DIFF;
    return agg;
  }, {});

  const [raw_oracle_price_data, rawAssets] = await Promise.all([near.NearView(
    config.CONTRACT_ID,
    "get_oracle_price_data",
    {
      account_id: config.NEAR_ACCOUNT_ID,
      asset_ids: tickers,
      recency_duration_sec: Math.floor(config.MAX_NO_REPORT_DURATION / 1000),
    }
  ), near.NearView(
    config.CONTRACT_ID,
    "get_assets",
    {}
  )]);

  const liveAssets = new Set(rawAssets.map(asset => asset[0]));

  const old_prices = raw_oracle_price_data.prices.reduce(
    (obj, item) =>
      Object.assign(obj, {
        [item.asset_id]: item.price
          ? { multiplier: item.price.multiplier, decimals: item.price.decimals }
          : { multiplier: 0, decimals: 0 },
      }),
    {}
  );

  await bot.updatePrices(relativeDiffs, old_prices, new_prices, state, liveAssets);

  SaveJson(state, config.STATE_FILENAME);
}

setTimeout(() => {
  process.exit(1);
}, config.REPORT_TIMEOUT);

main().then(() => {
  process.exit(0);
});
