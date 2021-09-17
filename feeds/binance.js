const Binance = require('binance-api-node').default

module.exports = {
    getPrices: async function (coins) {
        const client = Binance();

        let tickers_to_process = Object.keys(coins)
            .filter(ticker => coins[ticker].binance);


        const promises = tickers_to_process
            .map(ticker => client.prices({symbol: coins[ticker].binance}));

        let tickers_prepared = tickers_to_process.reduce((object, ticker) => {
            object[coins[ticker].binance] = ticker;
            return object
        }, {});

        return Promise.all(promises).then(values => {
            return values.reduce((object, price) => {
                let ticker = Object.keys(price)[0];
                object [tickers_prepared[ticker]] = parseFloat(price[ticker])
                return object;
            }, {})
        })
    }
}
