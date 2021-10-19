const near = require("./near");
const config = require("./config");
const { IsDifferentEnough } = require("./functions");

module.exports = {
  updatePrices: async function (tickers, old_prices, new_prices, last_report) {
    const current_time = new Date().getTime();
    const time_from_last_report = current_time - last_report;
    console.log(
      `Time from last report: ${(time_from_last_report / 1e3).toFixed(3)} sec`
    );
    const time_to_report =
      time_from_last_report > config.MAX_NO_REPORT_DURATION;
    const prices_to_update = [];
    tickers.map((ticker) => {
      console.log(
        `Compare ${ticker}: ${old_prices[
          ticker
        ].multiplier.toString()} and ${new_prices[
          ticker
        ].multiplier.toString()}`
      );
      if (
        time_to_report ||
        IsDifferentEnough(old_prices[ticker], new_prices[ticker])
      ) {
        console.log(`!!! Update ${ticker} price`);
        prices_to_update.push({
          asset_id: ticker,
          price: {
            multiplier: Math.round(new_prices[ticker].multiplier).toString(),
            decimals: new_prices[ticker].decimals,
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
