const { EvmPriceServiceConnection } = require("@pythnetwork/pyth-evm-js");

const connection = new EvmPriceServiceConnection("https://hermes.pyth.network");

const MAX_TIME_DIFFERENCE = 120;

module.exports = {
  getPrices: async function (coins) {
    let address_to_process = Object.keys(coins)
      .filter((address) => !!coins[address].pyth)
      .map((address) => coins[address].pyth);

    let prices = {};
    await (async () => {
      const priceData = await connection.getLatestPriceFeeds(
        address_to_process
      );

      priceData.map((data) => {
        const priceObject = data.price;
        let decimalPrice =
          parseFloat(priceObject.price) * Math.pow(10, priceObject.expo);

        const now = Math.floor(Date.now() / 1000); // Convert current time to seconds
        const timeDifference = now - priceObject.publishTime;

        if (timeDifference <= MAX_TIME_DIFFERENCE) {
          const coin = Object.keys(coins).filter(
            (address) => coins[address].pyth === `0x${data.id}`
          );
          if (coin.length) {
            prices[coin[0]] = decimalPrice;
          }
        } else {
          console.error(
            `Pyth price fro ${data.id} is stale. Published more than ${MAX_TIME_DIFFERENCE} seconds ago.`
          );
        }
      });
    })().catch(function (error) {
      console.error("Pyth error", error);
    });
    //console.log("pyth prices", prices)
    return prices;
  },
};
