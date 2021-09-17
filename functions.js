module.exports = {
    /**
     * @return {boolean}
     */
    IsDifferentEnough: function (price_old, price_new) {
        if (price_old.denominator > 0 && price_old.denominator != price_new.denominator)
            throw Error(`Illegal denominator`);

        return (Math.abs(price_new.multiplier - price_old.multiplier) >= price_old.multiplier * 0.001); // 0.5%+ diff
    },

    GetMedianPrice: function (data, ticker) {
        let values = data.reduce((object, prices) => {
            if (prices.hasOwnProperty(ticker))
                object.push(prices[ticker]);
            return object;
        }, []);

        if(!values.length)
            return 0;

        values.sort((a, b) => a - b);

        let half = Math.floor(values.length / 2);

        if (values.length % 2)
            return values[half];

        return (values[half - 1] + values[half]) / 2.0;
    }
};