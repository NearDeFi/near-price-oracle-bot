const near = require("./near");
const config = require("./config");
const {IsDifferentEnough} = require("./functions");

module.exports = {
    updatePrices: function(tickers, old_prices, new_prices) {

        let prices_to_update = [];
        tickers.map(ticker => {
            console.log(`Compare ${ticker}: ${old_prices[ticker].multiplier.toString()} and ${new_prices[ticker].multiplier.toString()}`);
            if (IsDifferentEnough(old_prices[ticker], new_prices[ticker])) {
                console.log(`!!! Update ${ticker} price`)
                prices_to_update.push({
                    asset_id: ticker,
                    price: {
                        multiplier: Math.round(new_prices[ticker].multiplier).toString(),
                        decimals: new_prices[ticker].decimals
                    }
                })
            }
        });

        if (prices_to_update.length) {
            near.NearCall(config.NEAR_ACCOUNT_ID, config.CONTRACT_ID, "report_prices", {prices: prices_to_update})
                .then(resp => console.log(resp));
        }
}

}