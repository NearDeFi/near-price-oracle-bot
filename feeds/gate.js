const {GetAvgPrice} = require("../functions");
module.exports = {
  getPrices: async function (coins) {
    let tickers_to_process = Object.keys(coins).filter(
      (ticker) => coins[ticker].gate
    );

    return Promise.all(
      tickers_to_process.map((ticker) =>
        fetch(`https://data.gateapi.io/api2/1/ticker/${coins[ticker].gate}`)
      )
    )
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then((values) => {
        return values.reduce((object, price, index) => {
          if (price.result === "true") {
            object[tickers_to_process[index]] = GetAvgPrice(price?.highestBid, price?.lowestAsk, price?.last);
            return object;
          }
        }, {});
      })
      .catch(function (error) {
        console.error(error);
      });
  },
};
