const near = require("./near");
const config = require("./config");
const { IsDifferentEnough, getMilliSecDiffTimeFromNow } = require("./functions");

module.exports = {
  updatePrices: async function (relative_diffs, old_prices_data, new_prices, asset_statuses, state) {
    const current_time = new Date().getTime();
    // prices which are different enough to push into the oracle
    let prices_to_update = [];
    let all_prices_updates = [];
    Object.entries(relative_diffs).map(([ticker, relative_diff]) => {
      const old_price_data = old_prices_data[ticker] || {price: null, timestamp: null};
      const old_price = old_price_data.price;
      const new_price = new_prices[ticker] || { multiplier: 0, decimals: 0 };
      if (new_price.multiplier > 0) {
        let last_timestamp_diff_milliseconds = old_price_data.timestamp ?
            getMilliSecDiffTimeFromNow(old_price_data.timestamp) :
            config.ASSET_UPDATE_PERIOD;

        let last_timestamp_diff_seconds = (last_timestamp_diff_milliseconds / 1000). toFixed()
        console.log(`Compare ${ticker}: ${old_price.multiplier.toString()} and ${new_price.multiplier.toString()} [${asset_statuses[ticker]}], last update: ${last_timestamp_diff_seconds}+ seconds ago`);

        const price_update = {
          asset_id: ticker,
          price: {
            multiplier: Math.round(new_price.multiplier).toString(),
            decimals: new_price.decimals,
          },
        };
        all_prices_updates.push(price_update);

        if (asset_statuses[ticker] === config.STATUS_ACTIVE && IsDifferentEnough(relative_diff, old_price, new_price)) {
          console.log(`!!! Update ${ticker} price, price diff is bigger than ${relative_diff}%`);
          prices_to_update.push(price_update);
        }
        else if (last_timestamp_diff_milliseconds >= config.ASSET_UPDATE_PERIOD)
        {
          console.log(`!!! Update ${ticker} price, price wasn't updated for ${last_timestamp_diff_seconds}+ seconds`);
          prices_to_update.push(price_update);
        }
      }
      else {
        console.log(`Skip ${ticker}: new price is missing`);
      }
    });

    // check if at least one asset with updated price has Active status
    if(prices_to_update.length) {
      const active_assets = Object.entries(prices_to_update).filter(price_update => asset_statuses[price_update[1].asset_id] === config.STATUS_ACTIVE);
      if (!active_assets.length) {
        console.log(`Only hidden assets to update, waiting for active assets or full reload`);
        prices_to_update = [];
      }
    }

    if (
      state.lastFullUpdateTimestamp + config.FULL_UPDATE_PERIOD <=
      current_time
    ) {
      prices_to_update = all_prices_updates;
      state.lastFullUpdateTimestamp = current_time;
      console.log(`!!! Executing full price update`);
    }

    if (prices_to_update.length) {
      await near.NearCall(
        config.NEAR_ACCOUNT_ID,
        config.CONTRACT_ID,
        "report_prices",
        {
          prices: prices_to_update,
        }
      );
    }
  },
};
