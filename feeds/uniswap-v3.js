const { Token } = require("@uniswap/sdk-core");
const { ethers } = require("ethers");
const { computePoolAddress, FeeAmount } = require("@uniswap/v3-sdk");
const Quoter = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");
const IUniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");

const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const QUOTER_CONTRACT_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const MAINNET_NETWORK_ID = 1;
const AMOUNT_IN = 10000;

const MAINNET_RPC = "https://rpc.ankr.com/eth";

function fromReadableAmount(amount, decimals) {
  return ethers.utils.parseUnits(amount.toString(), decimals);
}

function toReadableAmount(rawAmount, decimals) {
  return ethers.utils.formatUnits(rawAmount, decimals);
}

function getProvider() {
  return new ethers.providers.JsonRpcProvider(MAINNET_RPC);
}

async function getPoolConstantsV3(tokenIn, tokenOut, poolFee) {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: tokenIn,
    tokenB: tokenOut,
    fee: poolFee,
  });

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    getProvider()
  );
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);

  return {
    token0,
    token1,
    fee,
  };
}

async function quoteV3(tokenIn, tokenOut, fee) {
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    getProvider()
  );
  const poolConstants = await getPoolConstantsV3(tokenIn, tokenOut, fee);

  const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(AMOUNT_IN, tokenIn.decimals).toString(),
    0
  );

  return toReadableAmount(quotedAmountOut, tokenOut.decimals);
}

module.exports = {
  getPrices: async function (coins) {
    try {
      let address_to_process = Object.keys(coins).filter(
        (address) => coins[address].uniswapv3
      );

      let prices = {};
      await Promise.all(
        address_to_process.map((address) =>
          (async () => {
            let { tokenIn, tokenOut, fee } = coins[address].uniswapv3;

            tokenIn = new Token(
              MAINNET_NETWORK_ID,
              tokenIn.address,
              tokenIn.decimals,
              "",
              ""
            );

            tokenOut = new Token(
              MAINNET_NETWORK_ID,
              tokenOut.address,
              tokenOut.decimals,
              "",
              ""
            );

            prices[address] =
              (await quoteV3(tokenIn, tokenOut, fee)) / AMOUNT_IN;
          })().catch(function (error) {
            console.error(error);
          })
        )
      );

      return prices;
    } catch (error) {
      console.error(error);
    }
  },
};
