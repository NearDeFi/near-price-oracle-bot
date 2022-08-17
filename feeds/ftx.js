const {fetchWithTimeout} = require("../functions");

module.exports = {
    getPrices: async function (coins) {
        let tickers_to_process = Object.keys(coins)
            .filter(ticker => coins[ticker].ftx);

        let tickers_prepared = tickers_to_process.reduce((object, ticker) => {
            object[coins[ticker].ftx] = ticker;
            return object
        }, {});


        return Promise.all(tickers_to_process.map(ticker => fetchWithTimeout(`https://ftx.com/api/markets/${coins[ticker].ftx}`)))
            .then(responses => Promise.all(responses.map(res => res.json())))
            .then(values => {
                return values.reduce((object, price) => {
                    if(price.success) {
                        let ticker = price.result.name;
                        object [tickers_prepared[ticker]] = parseFloat(price.result.price)
                        return object;
                    }
                }, {})
            })
            .catch(function(error) {
                console.error(error)
            })
    }
}
