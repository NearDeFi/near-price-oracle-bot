module.exports = {
    getPrices: async function (coins) {
        let tickers_to_process = Object.keys(coins)
            .filter(ticker => coins[ticker].huobi);

        let tickers_prepared = tickers_to_process.reduce((object, ticker) => {
            object[coins[ticker].huobi] = ticker;
            return object
        }, {});

        return Promise.all(tickers_to_process.map(ticker => fetch(`https://api.huobi.pro/market/trade?symbol=${coins[ticker].huobi}`)))
            .then(responses => Promise.all(responses.map(res => res.json())))
            .then(values => {
                return values.reduce((object, price) => {
                    const ticker = price.ch.match("market\.(.*?)\.trade\.detail")[1];
                    object [tickers_prepared[ticker]] = parseFloat(price.tick.data[0].price)
                    return object;
                }, {})
            })
            .catch(function (error) {
                console.error(error)
            })
    }
}
