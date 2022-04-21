const fs = require("fs");

const ONE_MINUTE = 60 * 1000;
const FIFTY_SECONDS = 50 * 1000;

class Twap {
  constructor() {
    this.twap_history = {};
  }

  loadTwapHistory(file_path) {
    const data = fs.readFileSync(file_path);
    const json_data = JSON.parse(data);
    this.twap_history = sortByTimestamp(json_data);
  }

  storeTwapHistory(file_path) {
    const json_str = JSON.stringify(this.twap_history, null, 2);
    fs.writeFileSync(file_path, json_str);
  }

  updatePrice(ticker, price) {
    const current_time = new Date().getTime();
    const one_munite_ago = current_time - ONE_MINUTE;

    if (this.twap_history.hasOwnProperty(ticker)) {
      // Remove stale records
      this.twap_history[ticker] = this.twap_history[ticker].filter((e) => {return e["timestamp"] > one_munite_ago;});
    } else {
      this.twap_history[ticker] = [];
    }

    var new_price = {
      timestamp: current_time,
      price: price,
      cumulative: 0
    };
    if (this.twap_history[ticker].length > 0) {
      const length = this.twap_history[ticker].length;
      const last_price = this.twap_history[ticker][length - 1];
      const time_diff = current_time - last_price["timestamp"];
      const cumulative = time_diff * price["multiplier"] + last_price["cumulative"];

      new_price.cumulative = cumulative;
    }
    this.twap_history[ticker].push(new_price);
  }

  updatePrices(tickers, prices) {
    tickers.map((ticker) => this.updatePrice(ticker, prices[ticker]))
  }

  getPrice(ticker) {
    if (!this.twap_history.hasOwnProperty(ticker)) {
      return {decimals: 0, multiplier: 0};
    }

    const length = this.twap_history[ticker].length;

    if (length == 0) {
      return {decimals: 0, multiplier: 0};
    }

    if (length == 1) {
      const price = this.twap_history[ticker][0]["price"]
      return price;
    }

    const price1 = this.twap_history[ticker][0];
    const price2 = this.twap_history[ticker][length - 1];
    const time_diff = price2["timestamp"] - price1["timestamp"];

    if (time_diff < FIFTY_SECONDS) {
      return price2["price"];
    }

    const multiplier = (price2["cumulative"] - price1["cumulative"]) / time_diff;

    return {decimals: price2["price"]["decimals"], multiplier: multiplier};
  }

  getPrices() {
    var prices = {};
    for (var ticker in this.twap_history) {
      prices[ticker] = this.getPrice(ticker);
    }
    return prices;
  }
}

function sortByTimestamp(twap_history) {
  for (var key in twap_history) {
    twap_history[key] = twap_history[key].sort((a, b) => {
      if (a["timestamp"] < b["timestamp"]) {
        return -1;
      }
      if (a["timestamp"] > b["timestamp"]) {
        return 1;
      }
      return 0;
    });
  }
  return twap_history;
}

module.exports = Twap