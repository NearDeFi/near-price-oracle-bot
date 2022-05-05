module.exports = {
  getPrices: async function (coins) {
    let tickers_to_process = Object.keys(coins).filter(
      (ticker) => coins[ticker].kucoin
    );

    return Promise.all(
      tickers_to_process.map((ticker) =>
        fetch(
          `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${coins[ticker].kucoin}`
        )
      )
    )
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then((values) => {
        return values.reduce((object, price, index) => {
          if (price.data) {
            object[tickers_to_process[index]] =
              (parseFloat(price.data.bestBid) +
                parseFloat(price.data.bestAsk)) /
              2;
            return object;
          }
        }, {});
      })
      .catch(function (error) {
        console.error(error);
      });
  },
};
