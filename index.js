const near = require('./near');
const config = require('./config');
const bot = require('./bot');
const coingecko = require('./feeds/coingecko');
const binance = require('./feeds/binance');
const binanceFutures = require('./feeds/binance-futures');
const {GetMedianPrice} = require("./functions");

console.log("Welcome to the Oracle Bot")

let coins = {
    "wrap.testnet": {decimals: 24, coingecko: "near", binance: "NEARUSDT"},
    "neth.ft-fin.testnet": {decimals: 18, coingecko: "ethereum", binance: "ETHUSDT"},
    "nusdt.ft-fin.testnet": {decimals: 6, coingecko: "tether"},
    "nusdc.ft-fin.testnet": {decimals: 6, coingecko: "usd-coin"},
    "ndai.ft-fin.testnet": {decimals: 18, coingecko: "dai"}
};

const fraction_digits = 4;

Promise.all([
        binance.getPrices(coins),
        coingecko.getPrices(coins),
        binanceFutures.getPrices(coins)
    ]
).then(values => {
    const tickers = Object.keys(coins)
    let new_prices = tickers.reduce((object, ticker) => {
        let price = GetMedianPrice(values, ticker);
        const discrepancy_denominator = Math.pow(10, fraction_digits);

        object[ticker] = {
            multiplier: Math.round(price * discrepancy_denominator),
            decimals: coins[ticker].decimals + fraction_digits
        };
        return object;
    }, {});

    near.NearView(config.CONTRACT_ID, "get_price_data", {asset_ids: tickers})
        .then(response => response.prices)
        .then(old_prices => old_prices.reduce((obj, item) => Object.assign(obj, {
            [item.asset_id]:
                item.price
                    ? {multiplier: item.price.multiplier, decimals: item.price.decimals}
                    : {multiplier: 0, decimals: 0}
        }), {}))
        .then(old_prices => {
            bot.updatePrices(tickers, old_prices, new_prices);
        })
});