const config = require("./config");
const fs = require("fs");

module.exports = {
  /**
   * @return {boolean}
   */
  IsDifferentEnough: function (price_old, price_new) {
    const max_decimals = Math.max(price_new.decimals, price_old.decimals);
    const old_multiplier =
      price_old.multiplier *
      (price_old.decimals < price_new.decimals
        ? Math.pow(10, max_decimals - price_old.decimals)
        : 1);
    const new_multiplier =
      price_new.multiplier *
      (price_new.decimals < price_old.decimals
        ? Math.pow(10, max_decimals - price_new.decimals)
        : 1);

    return (
      Math.abs(new_multiplier - old_multiplier) >=
      old_multiplier * config.RELATIVE_DIFF
    );
  },

  /**
   * @return {number}
   */
  GetMedianPrice: function (data, ticker) {
    let values = data.reduce((object, prices) => {
      if (prices.hasOwnProperty(ticker)) object.push(prices[ticker]);
      return object;
    }, []);

    if (!values.length) return 0;

    values.sort((a, b) => a - b);

    let half = Math.floor(values.length / 2);

    if (values.length % 2) return values[half];

    return (values[half - 1] + values[half]) / 2.0;
  },

  LoadJson: function (filename, ignoreError = true) {
    try {
      let rawData = fs.readFileSync(filename);
      return JSON.parse(rawData);
    } catch (e) {
      if (!ignoreError) {
        console.error("Failed to load JSON:", filename, e);
      }
    }
    return null;
  },

  SaveJson: function (json, filename) {
    try {
      const data = JSON.stringify(json);
      fs.writeFileSync(filename, data);
    } catch (e) {
      console.error("Failed to save JSON:", filename, e);
    }
  },
};
