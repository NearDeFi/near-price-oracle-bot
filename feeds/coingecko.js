const {CoinGeckoClient} = require("coingecko-api-v3");

module.exports = {
    getPrices: async function (coins) {
        try {
            const tickers = Object.keys(coins);

            const client = new CoinGeckoClient({
                timeout: 10000,
                autoRetry: true,
            });

            let prices = await client.simplePrice({
                ids: tickers.map((ticker) => coins[ticker].coingecko).join(","),
                vs_currencies: "usd",
            });

            return tickers.reduce((object, ticker) => {
                object[ticker] = parseFloat(prices[coins[ticker].coingecko].usd);
                return object;
            }, {});
        } catch (error) {
            console.error(error);
        }
    },
};
