module.exports = {
    getPrices: async function (coins) {
        let tickers_to_process = Object.keys(coins).filter(
            (ticker) => coins[ticker].huobi
        );

        let prices = {};
        await Promise.all(
            tickers_to_process.map((ticker) =>
                (async () => {
                    let res = await fetch(
                        `https://api.huobi.pro/market/detail/merged?symbol=${coins[ticker].huobi}`
                    );
                    res = await res.json();
                    prices[ticker] = (res.tick.bid[0] + res.tick.ask[0]) / 2;
                })().catch(function (error) {
                    console.error(error);
                })
            )
        );
        return prices;
    },
};
