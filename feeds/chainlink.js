const Web3 = require("web3");

const {fetchWithTimeout} = require("../functions");

const getData = (address) => {
    return {
        "method": "eth_call",
        "params": [
            {
                "from": null,
                "to": address,
                "data": "0x50d25bcd" // latestAnswer
            }, "latest"
        ],
        "id": 1,
        "jsonrpc": "2.0"
    };
}

const web3 = new Web3();

module.exports = {
    getPrices: async function (coins) {
        let address_to_process = Object.keys(coins).filter(
            (address) => coins[address].chainlink
        );

        let prices = {};
        await Promise.all(
            address_to_process.map((address) =>
                (async () => {
                    let res = await fetchWithTimeout("https://cloudflare-eth.com/v1/mainnet", {
                        method: 'POST',
                        body: JSON.stringify(getData(coins[address].chainlink)),
                        headers: {'Content-Type': 'application/json'}

                    })
                        .then(resp => resp.json())
                        .then(resp => {
                            return (web3.utils.toDecimal(resp?.result ?? 0))
                        });
                    prices[address] = res / 100000000;
                })().catch(function (error) {
                    console.error(error);
                })
            )
        );

        //console.log("chainlink prices", prices)
        return prices;
    },
};
