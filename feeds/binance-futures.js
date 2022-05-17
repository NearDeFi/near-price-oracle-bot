const Binance = require("binance-api-node").default;

module.exports = {
    getPrices: async function (coins) {
        try {
            const client = Binance();

            let tickers_to_process = Object.keys(coins)
                .filter(ticker => coins[ticker].binance);

            let tickers_prepared = tickers_to_process.reduce((object, ticker) => {
                object[coins[ticker].binance] = ticker;
                return object
            }, {});

            const prices = await client.futuresPrices();

            let tickers = Object.keys(tickers_prepared);

            return tickers_to_process.reduce((object, ticker, index) => {
                const binanceTicker = tickers[index];
                if (binanceTicker in prices) {
                    object[ticker] = parseFloat(prices[binanceTicker]);
                }
                return object;
            }, {});
        } catch (error) {
            console.error(error);
        }
    },
};
