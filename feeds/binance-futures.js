const Binance = require("binance-api-node").default;

module.exports = {
    getPrices: async function (coins) {
        try {
            const client = Binance();

            let tickers_to_process = Object.keys(coins).filter(
                (ticker) => coins[ticker].binance
            );

            const prices = await client.futuresPrices();

            return tickers_to_process.reduce((object, ticker) => {
                if (ticker in prices) {
                    object[ticker] = parseFloat(prices[ticker]);
                }
                return object;
            }, {});
        } catch (error) {
            console.error(error);
        }
    },
};
