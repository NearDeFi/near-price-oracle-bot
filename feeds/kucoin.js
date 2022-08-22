const {GetAvgPrice, fetchWithTimeout} = require("../functions");

module.exports = {
  getPrices: async function (coins) {
    let tickers_to_process = Object.keys(coins).filter(
      (ticker) => coins[ticker].kucoin
    );

    return Promise.all(
      tickers_to_process.map((ticker) =>
        fetchWithTimeout(
          `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${coins[ticker].kucoin}`
        )
      )
    )
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then((values) => {
        return values.reduce((object, price, index) => {
          if (price.data) {
            object[tickers_to_process[index]] = GetAvgPrice(price?.data?.bestBid, price?.data?.bestAsk, price?.data?.price);
            return object;
          }
        }, {});
      })
      .catch(function (error) {
        console.error(error);
      });
  },
};
