//! The code below is based on skyward finance https://github.com/skyward-finance/app-ui.

const Big = require("big.js");
const config = require("../config");
const nearConfig = config.getConfig(process.env.NODE_ENV || "development");

const SimplePool = "SIMPLE_POOL";
const StablePool = "STABLE_SWAP";

const usdTokensDecimals =
  nearConfig.networkId === "mainnet"
    ? {
        "6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near": 18,
        "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near": 6,
        "dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near": 6,
        usn: 18,
      }
    : {
        "dai.fakes.testnet": 18,
        "usdt.fakes.testnet": 6,
        "usdc.fakes.testnet": 6,
        "usdn.testnet": 18,
      };

const usdTokens = Object.entries(usdTokensDecimals).reduce(
  (acc, [key, value]) => {
    acc[key] = Big(10).pow(value);
    return acc;
  },
  {}
);

function stablePoolGetReturn(pool, tokenIn, amountIn, tokenOut, ignoreFees) {
  let tokenInIndex = pool.tt.indexOf(tokenIn);
  let tokenOutIndex = pool.tt.indexOf(tokenOut);
  // Sub 1
  const cAmountIn = amountIn
    .sub(1)
    .mul(Big(10).pow(18 - usdTokensDecimals[tokenIn]));

  let y = stablePoolComputeY(
    pool,
    cAmountIn.add(pool.cAmounts[tokenInIndex]),
    tokenInIndex,
    tokenOutIndex
  );

  let dy = pool.cAmounts[tokenOutIndex].sub(y);
  let tradeFee = dy
    .mul(ignoreFees ? 0 : pool.fee)
    .div(10000)
    .round(0, 0);
  let amountSwapped = dy.sub(tradeFee);

  return amountSwapped
    .div(Big(10).pow(18 - usdTokensDecimals[tokenOut]))
    .round(0, 0);
}

function stablePoolGetInverseReturn(
  pool,
  tokenOut,
  amountOut,
  tokenIn,
  ignoreFees
) {
  let tokenInIndex = pool.tt.indexOf(tokenIn);
  let tokenOutIndex = pool.tt.indexOf(tokenOut);

  const amountOutWithFee = amountOut
    .mul(10000)
    .div(10000 - ignoreFees ? 0 : pool.fee)
    .round(0, 0);
  const cAmountOut = amountOutWithFee.mul(
    Big(10).pow(18 - usdTokensDecimals[tokenOut])
  );

  let y = stablePoolComputeY(
    pool,
    pool.cAmounts[tokenOutIndex].sub(cAmountOut),
    tokenOutIndex,
    tokenInIndex
  );

  let cAmountIn = y.sub(pool.cAmounts[tokenInIndex]);

  // Adding 1 for internal pool rounding
  return cAmountIn
    .div(Big(10).pow(18 - usdTokensDecimals[tokenIn]))
    .add(1)
    .round(0, 0);
}

function getRefReturn(pool, tokenIn, amountIn, tokenOut, ignoreFees) {
  if (!amountIn || amountIn.eq(0)) {
    return Big(0);
  }
  if (
    !(tokenIn in pool.tokens) ||
    !(tokenOut in pool.tokens) ||
    tokenIn === tokenOut
  ) {
    return null;
  }
  if (pool.stable) {
    return stablePoolGetReturn(pool, tokenIn, amountIn, tokenOut, ignoreFees);
  }
  const balanceIn = pool.tokens[tokenIn];
  const balanceOut = pool.tokens[tokenOut];
  let amountWithFee = Big(amountIn).mul(Big(10000 - ignoreFees ? 0 : pool.fee));
  return amountWithFee
    .mul(balanceOut)
    .div(Big(10000).mul(balanceIn).add(amountWithFee))
    .round(0, 0);
}

function getRefInverseReturn(pool, tokenOut, amountOut, tokenIn, ignoreFees) {
  if (!amountOut || amountOut.eq(0)) {
    return Big(0);
  }
  if (
    !(tokenIn in pool.tokens) ||
    !(tokenOut in pool.tokens) ||
    tokenIn === tokenOut
  ) {
    return null;
  }
  if (pool.stable) {
    return stablePoolGetInverseReturn(
      pool,
      tokenOut,
      amountOut,
      tokenIn,
      ignoreFees
    );
  }
  const balanceIn = pool.tokens[tokenIn];
  const balanceOut = pool.tokens[tokenOut];
  if (amountOut.gte(balanceOut)) {
    return null;
  }
  return Big(10000)
    .mul(balanceIn)
    .mul(amountOut)
    .div(Big(10000 - ignoreFees ? 0 : pool.fee).mul(balanceOut.sub(amountOut)))
    .round(0, 3);
}

function stablePoolComputeD(pool) {
  let sumX = pool.cAmounts.reduce((sum, v) => sum.add(v), Big(0));
  if (sumX.eq(0)) {
    return Big(0);
  } else {
    let d = sumX;
    let dPrev;

    for (let i = 0; i < 256; ++i) {
      let dProd = d;
      for (let j = 0; j < pool.nCoins; ++j) {
        dProd = dProd.mul(d).div(pool.cAmounts[j].mul(pool.nCoins)).round(0, 0);
      }
      dPrev = d;

      let leverage = sumX.mul(pool.ann);
      let numerator = dPrev.mul(dProd.mul(pool.nCoins).add(leverage));
      let denominator = dPrev
        .mul(pool.ann.sub(1))
        .add(dProd.mul(pool.nCoins + 1));
      d = numerator.div(denominator).round(0, 0);

      // Equality with the precision of 1
      if (d.gt(dPrev)) {
        if (d.sub(dPrev).lte(1)) {
          break;
        }
      } else if (dPrev.sub(d).lte(1)) {
        break;
      }
    }
    return d;
  }
}

function stablePoolComputeY(pool, xCAmount, indexX, indexY) {
  // invariant
  let d = pool.d;
  let s = xCAmount;
  let c = d.mul(d).div(xCAmount).round(0, 0);
  pool.cAmounts.forEach((c_amount, idx) => {
    if (idx !== indexX && idx !== indexY) {
      s = s.add(c_amount);
      c = c.mul(d).div(c_amount).round(0, 0);
    }
  });
  c = c.mul(d).div(pool.ann.mul(pool.nn)).round(0, 0);
  let b = d.div(pool.ann).round(0, 0).add(s); // d will be subtracted later

  // Solve for y by approximating: y**2 + b*y = c
  let yPrev;
  let y = d;
  for (let i = 0; i < 256; ++i) {
    yPrev = y;
    // $ y_{k+1} = \frac{y_k^2 + c}{2y_k + b - D} $
    let yNumerator = y.pow(2).add(c);
    let yDenominator = y.mul(2).add(b).sub(d);
    y = yNumerator.div(yDenominator).round(0, 0);
    if (y.gt(yPrev)) {
      if (y.sub(yPrev).lte(1)) {
        break;
      }
    } else if (yPrev.sub(y).lte(1)) {
      break;
    }
  }
  return y;
}

async function prepareRef(near, poolIds) {
  const promises = poolIds.map((pool_id) =>
    near.NearView(nearConfig.refContractName, "get_pool", { pool_id })
  );
  const rawPools = await Promise.all(promises);

  const poolsByToken = {};
  const poolsByPair = {};

  const addPools = (token, pool) => {
    let ps = poolsByToken[token] || [];
    ps.push(pool);
    poolsByToken[token] = ps;

    pool.ots[token].forEach((ot) => {
      const pair = `${token}:${ot}`;
      ps = poolsByPair[pair] || [];
      ps.push(pool);
      poolsByPair[pair] = ps;
    });
  };

  const pools = {};
  rawPools.forEach((pool, i) => {
    if (pool.pool_kind === SimplePool || pool.pool_kind === StablePool) {
      const tt = pool.token_account_ids;
      const p = {
        stable: pool.pool_kind === StablePool,
        index: i,
        tt,
        tokens: tt.reduce((acc, token, tokenIndex) => {
          acc[token] = Big(pool.amounts[tokenIndex]);
          return acc;
        }, {}),
        ots: tt.reduce((acc, token) => {
          acc[token] = tt.filter((t) => t !== token);
          return acc;
        }, {}),
        fee: pool.total_fee,
        shares: Big(pool.shares_total_supply),
        amp: pool.amp || 0,
      };
      if (p.stable) {
        p.cAmounts = [...pool.amounts].map((amount, idx) => {
          let factor = Big(10).pow(18 - usdTokensDecimals[tt[idx]]);
          return Big(amount).mul(factor);
        });
        p.nCoins = p.cAmounts.length;
        p.nn = Big(Math.pow(p.nCoins, p.nCoins));
        p.ann = Big(p.amp).mul(p.nn);
        p.d = stablePoolComputeD(p);
      }

      if (p.shares.gt(0)) {
        pools[p.index] = p;
        p.tt.forEach((t) => addPools(t, p));
      }
    }
  });

  return {
    pools,
    poolsByToken,
    poolsByPair,
  };
}

const findBestReturn = (
  refFinance,
  inTokenAccountId,
  outTokenAccountId,
  amountIn,
  ignoreFees
) => {
  let swapInfo = {
    amountIn,
    amountOut: Big(0),
  };
  // Computing path
  Object.values(refFinance.poolsByToken[inTokenAccountId] || {}).forEach(
    (pool) => {
      // 1 token
      if (outTokenAccountId in pool.tokens) {
        const poolReturn =
          getRefReturn(
            pool,
            inTokenAccountId,
            amountIn,
            outTokenAccountId,
            ignoreFees
          ) || Big(0);

        if (poolReturn.gt(swapInfo.amountOut)) {
          swapInfo = {
            amountIn,
            amountOut: poolReturn,
            pools: [pool],
            swapPath: [inTokenAccountId, outTokenAccountId],
          };
        }
      } else {
        // 2 tokens
        pool.ots[inTokenAccountId].forEach((middleTokenAccountId) => {
          const pair = `${middleTokenAccountId}:${outTokenAccountId}`;
          let poolReturn = false;
          Object.values(refFinance.poolsByPair[pair] || {}).forEach((pool2) => {
            poolReturn =
              poolReturn === false
                ? getRefReturn(
                    pool,
                    inTokenAccountId,
                    amountIn,
                    middleTokenAccountId,
                    ignoreFees
                  )
                : poolReturn;
            if (!poolReturn) {
              return;
            }
            const pool2Return =
              getRefReturn(
                pool2,
                middleTokenAccountId,
                poolReturn,
                outTokenAccountId,
                ignoreFees
              ) || Big(0);
            if (pool2Return.gt(swapInfo.amountOut)) {
              swapInfo = {
                amountIn,
                amountOut: pool2Return,
                pools: [pool, pool2],
                swapPath: [
                  inTokenAccountId,
                  middleTokenAccountId,
                  outTokenAccountId,
                ],
              };
            }
          });
        });
      }
    }
  );
  return Object.assign(swapInfo, {
    inTokenAccountId,
    outTokenAccountId,
    expectedAmountOut: Big(0),
  });
};

const findBestInverseReturn = (
  refFinance,
  inTokenAccountId,
  outTokenAccountId,
  availableInToken,
  outAmount,
  ignoreFees
) => {
  let swapInfo = {
    amountIn: availableInToken,
    amountOut: Big(0),
  };
  // Computing path
  Object.values(refFinance.poolsByToken[outTokenAccountId] || {}).forEach(
    (pool) => {
      // 1 token
      if (inTokenAccountId in pool.tokens) {
        const amountIn = getRefInverseReturn(
          pool,
          outTokenAccountId,
          outAmount,
          inTokenAccountId,
          ignoreFees
        );
        if (!amountIn) {
          return;
        }

        if (amountIn.lt(swapInfo.amountIn)) {
          swapInfo = {
            amountIn,
            amountOut: outAmount,
            pools: [pool],
            swapPath: [inTokenAccountId, outTokenAccountId],
          };
        }
      } else {
        // 2 tokens
        pool.ots[outTokenAccountId].forEach((middleTokenAccountId) => {
          const pair = `${middleTokenAccountId}:${inTokenAccountId}`;
          let middleAmountIn = false;
          Object.values(refFinance.poolsByPair[pair] || {}).forEach((pool2) => {
            middleAmountIn =
              middleAmountIn === false
                ? getRefInverseReturn(
                    pool,
                    outTokenAccountId,
                    outAmount,
                    middleTokenAccountId,
                    ignoreFees
                  )
                : middleAmountIn;
            if (!middleAmountIn) {
              return;
            }
            const amountIn = getRefInverseReturn(
              pool2,
              middleTokenAccountId,
              middleAmountIn,
              inTokenAccountId,
              ignoreFees
            );
            if (!amountIn) {
              return;
            }
            if (amountIn.lt(swapInfo.amountIn)) {
              swapInfo = {
                amountIn,
                amountOut: outAmount,
                pools: [pool2, pool],
                swapPath: [
                  inTokenAccountId,
                  middleTokenAccountId,
                  outTokenAccountId,
                ],
              };
            }
          });
        });
      }
    }
  );

  return Object.assign(swapInfo, {
    inTokenAccountId,
    outTokenAccountId,
    expectedAmountOut: outAmount,
  });
};

async function computeUsnPriceMultiplier(
  near,
  usnTokenId,
  usdtTokenId,
  stablePoolId
) {
  const refFinance = await prepareRef(near, [stablePoolId]);
  const humanAmountIn = Big(10000);
  const usnSwapInfo = findBestReturn(
    refFinance,
    usnTokenId,
    usdtTokenId,
    humanAmountIn.mul(Big(10).pow(18)),
    true
  );
  if (!usnSwapInfo) {
    console.error("Failed to compute USN swap info");
    return null;
  }
  const humanAmountOut = usnSwapInfo.amountOut.div(Big(10).pow(6));
  const usnPriceMultiplier = humanAmountOut.div(humanAmountIn).toNumber();
  if (usnPriceMultiplier < 0.95 || usnPriceMultiplier > 1.05) {
    console.error(`USN stable pool is unbalanced. Price: ${usnPriceMultiplier}`);
    return null;
  }
  return usnPriceMultiplier;
}

module.exports = {
  computeUsnPriceMultiplier,
};
