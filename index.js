const {CoinGeckoClient} = require('coingecko-api-v3');
const near = require('./near');
const {IsDifferentEnough} = require('./functions');

const contract = process.env.CONTRACT_ID || "dev-1631302633591-50236902542063";
const account_id = process.env.NEAR_ACCOUNT_ID || 'zavodil.testnet';

const client = new CoinGeckoClient({
    timeout: 10000,
    autoRetry: true,
});

console.log("Welcome to the Oracle Bot")

let coins = {
    "wrap.testnet": {coingecko: "near", decimals: 24},
    "neth.ft-fin.testnet": {coingecko: "ethereum", decimals: 18},
    "nusdt.ft-fin.testnet": {coingecko: "tether", decimals: 6},
    "nusdc.ft-fin.testnet": {coingecko: "usd-coin", decimals: 6},
    "ndai.ft-fin.testnet": {coingecko: "dai", decimals: 18}
};

const tickers = Object.keys(coins);

// coingecko
const fraction_digits = 2;
client.simplePrice({ids: tickers.map(ticker => coins[ticker].coingecko).join(","), vs_currencies: "usd"})
    .then((rates) => {
        let new_prices = {};

        tickers.map(ticker => {
            const coin = coins[ticker];
            const discrepancy_denominator = Math.pow(10, fraction_digits);
            const rate = rates[coin.coingecko].usd * discrepancy_denominator;

            new_prices[ticker] = {
                multiplier: rate,
                decimals: Math.floor(coin.decimals + fraction_digits)
            };
        });

        near.NearView(contract, "get_price_data", {asset_ids: tickers})
            .then(response => response.prices)
            .then(old_prices => old_prices.reduce((obj, item) => Object.assign(obj, {
                [item.asset_id]:
                    item.price
                        ? {multiplier: item.price.multiplier, decimals: item.price.decimals}
                        : {multiplier: 0, decimals: 0}
            }), {}))
            .then(old_prices => {
                let prices_to_update = [];
                tickers.map(ticker => {
                    console.log(`Compare ${ticker}: ${old_prices[ticker].multiplier.toString()} and ${new_prices[ticker].multiplier.toString()}`);
                    if (IsDifferentEnough(old_prices[ticker], new_prices[ticker])) {
                        console.log(`!!! Update ${ticker} price`)
                        prices_to_update.push({
                            asset_id: ticker,
                            price: {
                                multiplier: Math.floor(new_prices[ticker].multiplier).toString(),
                                decimals: new_prices[ticker].decimals
                            }
                        })
                    }
                });

                if (prices_to_update.length) {
                    near.NearCall(account_id, contract, "report_prices", {prices: prices_to_update})
                        .then(resp => console.log(resp));
                }
            })
    });


/*
console.log(IsDifferentEnough(
    {
        multiplier: new BN(200),
        denominator: new BN(100),
    },
    {
        multiplier: new BN(0),
        denominator: new BN(100),
    }));
 */