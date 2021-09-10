const BN = require('bn.js');

module.exports = {
    GetBN: function (power) {
        return new BN("1" + "0".repeat(power));
    },

    IsDifferentEnough: function(price_old, price_new) {
        if (price_old.denominator.gt(new BN(0)) && price_old.denominator.cmp(price_new.denominator) !== 0)
            throw Error(`Illegal denominator`);

        return (price_new.numerator.sub(price_old.numerator).abs().gte(price_old.numerator.div(new BN(1000)))); // 0.1%+ diff
    }
};