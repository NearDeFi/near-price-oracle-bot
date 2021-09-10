const {CoinGeckoClient} = require('coingecko-api-v3');
const BN = require('bn.js');
const near = require('./near');
const {GetBN, IsDifferentEnough} = require('./functions');

const contract = process.env.CONTRACT_ID || "dev-1631221522950-91597549533987";
const account_id = process.env.NEAR_ACCOUNT_ID || 'zavodil.testnet';

const client = new CoinGeckoClient({
    timeout: 10000,
    autoRetry: true,
});

console.log("Welcome to the Oracle Bot")

let coins = {
    "near": {coingecko: "near", denominator: GetBN(24)},
    "eth": {coingecko: "ethereum", denominator: GetBN(18)},
    "usdt": {coingecko: "tether", denominator: GetBN(6)},
    "usdc": {coingecko: "usd-coin", denominator: GetBN(6)},
    "dai": {coingecko: "dai", denominator: GetBN(18)}
};

const tickers = Object.keys(coins);

client.simplePrice({ids: tickers.map(ticker => coins[ticker].coingecko).join(","), vs_currencies: "usd"})
    .then((rates) => {
        let new_prices = {};

        tickers.map(ticker => {
            const coin = coins[ticker];
            const discrepancy_denominator = Math.min(coin.denominator, Math.pow(10, 12));
            const rate = new BN(rates[coin.coingecko].usd * discrepancy_denominator);

            new_prices[ticker] = {
                numerator: rate.mul(coin.denominator.div(new BN(discrepancy_denominator))),
                denominator: coin.denominator
            };
        });

        near.NearView(contract, "get_price_data", {asset_ids: tickers})
            .then(response => response.prices)
            .then(old_prices => old_prices.reduce((obj, item) => Object.assign(obj, {
                [item.asset_id]:
                    item.price
                        ? {numerator: new BN(item.price.numerator), denominator: new BN(item.price.denominator)}
                        : {numerator: new BN(0), denominator: new BN(0)}
            }), {}))
            .then(old_prices => {
                let prices_to_update = [];
                tickers.map(ticker => {
                    console.log(`Compare ${ticker}: ${old_prices[ticker].numerator.toString()} and ${new_prices[ticker].numerator.toString()}`);
                    if (IsDifferentEnough(old_prices[ticker], new_prices[ticker])) {
                        console.log(`!!! Update ${ticker} price`)
                        prices_to_update.push({
                            asset_id: ticker,
                            price: {
                                numerator: new_prices[ticker].numerator.toString(),
                                denominator: new_prices[ticker].denominator.toString()
                            }
                        })
                    }
                });

                if (prices_to_update.length) {
                    near.NearCall(account_id, contract, "report_prices", {prices: prices_to_update})
                        .then(resp => console.log(resp));
                }
            })
    })


/*
console.log(IsDifferentEnough(
    {
        numerator: new BN(200),
        denominator: new BN(100),
    },
    {
        numerator: new BN(0),
        denominator: new BN(100),
    }));
 */