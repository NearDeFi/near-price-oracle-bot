const near = require("./near");
const config = require("./config");
const { IsDifferentEnough } = require("./functions");

module.exports = {
  updatePrices: async function (tickers, old_prices, new_prices) {
    const current_time = new Date().getTime();
    const prices_to_update = [];
    tickers.map((ticker) => {
      const old_price = old_prices[ticker];
      const new_price = new_prices[ticker];
      console.log(
        `Compare ${ticker}: ${old_price.multiplier.toString()} and ${new_price.multiplier.toString()}`
      );
      if (IsDifferentEnough(old_price, new_price) && new_price.multiplier > 0) {
        console.log(`!!! Update ${ticker} price`);
        prices_to_update.push({
          asset_id: ticker,
          price: {
            multiplier: Math.round(new_price.multiplier).toString(),
            decimals: new_price.decimals,
          },
        });
      }
    });

    if (prices_to_update.length) {
      const resp = await near.NearCall(
        config.NEAR_ACCOUNT_ID,
        config.CONTRACT_ID,
        "report_prices",
        {
          prices: prices_to_update,
        }
      );
      console.log(resp);
    }
  },
};
