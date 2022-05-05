module.exports = {
  getPrices: async function (coins) {
    let tickers_to_process = Object.keys(coins).filter(
      (ticker) => coins[ticker].cryptocom
    );

    let tickers_prepared = tickers_to_process.reduce((object, ticker) => {
      object[coins[ticker].cryptocom] = ticker;
      return object;
    }, {});

    return Promise.all(
      tickers_to_process.map((ticker) =>
        fetch(
          `https://api.crypto.com/v2/public/get-ticker?instrument_name=${coins[ticker].cryptocom}`
        )
      )
    )
      .then((responses) => Promise.all(responses.map((res) => res.json())))
      .then((values) => {
        return values.reduce((object, price) => {
          if (price?.result?.data?.t >= Date.now() - 10000) {
            let ticker = price.result.data.i;
            // last trade https://exchange-docs.crypto.com/spot/index.html#public-get-ticker
            object[tickers_prepared[ticker]] =
              (price.result.data.b + price.result.data.k) / 2;
            return object;
          }
        }, {});
      })
      .catch(function (error) {
        console.error(error);
      });
  },
};
