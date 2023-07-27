const CONTRACT_NAME = process.env.CONTRACT_NAME || "oracle.testnet";

module.exports = {
  CONTRACT_ID: CONTRACT_NAME,
  NEAR_ACCOUNT_ID: process.env.NEAR_ACCOUNT_ID || "account.testnet",
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,

  // Will report the prices at least every 50 seconds
  MAX_NO_REPORT_DURATION: process.env.MAX_NO_REPORT_DURATION
    ? parseFloat(process.env.MAX_NO_REPORT_DURATION)
    : 50000,
  // Relative difference. Default 0.005 or 0.5%
  RELATIVE_DIFF: process.env.RELATIVE_DIFF
    ? parseFloat(process.env.RELATIVE_DIFF)
    : 0.005,
  // Each price is reported with 4 digits after floating point.
  FRACTION_DIGITS: process.env.FRACTION_DIGITS
    ? parseInt(process.env.FRACTION_DIGITS)
    : 4,
  // Time out in milliseconds when the process is killed.
  REPORT_TIMEOUT: process.env.REPORT_TIMEOUT
    ? parseInt(process.env.REPORT_TIMEOUT)
    : 15000,

  // The filename to save bot state.
  STATE_FILENAME: process.env.STATE_FILENAME || "./data/state.json",

  // Time period in milliseconds to do full price refresh, helps save on gas.
  FULL_UPDATE_PERIOD: process.env.FULL_UPDATE_PERIOD
    ? parseInt(process.env.FULL_UPDATE_PERIOD)
    : 600000,

  // Time period in milliseconds to report about version of the bot
  VERSION_REPORT_PERIOD: process.env.VERSION_REPORT_PERIOD
      ? parseInt(process.env.VERSION_REPORT_PERIOD)
      : 86400000, // 1 day

  PRINT_DEBUG: !!process.env.PRINT_DEBUG,

  MIN_USN_LIQUIDITY_IN_POOL: process.env.MIN_USN_LIQUIDITY_IN_POOL
    ? parseFloat(process.env.MIN_USN_LIQUIDITY_IN_POOL)
    : 10_000 * 1e18,

  MIN_CLAIM_NEAR_BALANCE: process.env.MIN_CLAIM_NEAR_BALANCE ? parseFloat(process.env.MIN_CLAIM_NEAR_BALANCE) : 10,

  getConfig: (env) => {
    switch (env) {
      case "production":
      case "mainnet":
        return {
          networkId: "mainnet",
          nodeUrl: process.env.NODE_URL || "https://rpc.mainnet.near.org",
          contractName: CONTRACT_NAME || "null_address.near",
          walletUrl: "https://wallet.near.org",
          helperUrl: "https://helper.mainnet.near.org",
          explorerUrl: "https://explorer.mainnet.near.org",
          refContractName: "v2.ref-finance.near",
        };
      case "development":
      case "testnet":
        return {
          networkId: "testnet",
          nodeUrl: process.env.NODE_URL || "https://rpc.testnet.near.org",
          contractName: CONTRACT_NAME || "null_address.testnet",
          walletUrl: "https://wallet.testnet.near.org",
          helperUrl: "https://helper.testnet.near.org",
          explorerUrl: "https://explorer.testnet.near.org",
          refContractName: "ref-finance-101.testnet",
        };
      case "betanet":
        return {
          networkId: "betanet",
          nodeUrl: process.env.NODE_URL || "https://rpc.betanet.near.org",
          contractName: CONTRACT_NAME,
          walletUrl: "https://wallet.betanet.near.org",
          helperUrl: "https://helper.betanet.near.org",
          explorerUrl: "https://explorer.betanet.near.org",
        };
      case "local":
        return {
          networkId: "local",
          nodeUrl: "http://localhost:3030",
          keyPath: `${process.env.HOME}/.near/validator_key.json`,
          walletUrl: "http://localhost:4000/wallet",
          contractName: CONTRACT_NAME,
        };
      case "test":
      case "ci":
        return {
          networkId: "shared-test",
          nodeUrl: "https://rpc.ci-testnet.near.org",
          contractName: CONTRACT_NAME,
          masterAccount: "test.near",
        };
      case "ci-betanet":
        return {
          networkId: "shared-test-staging",
          nodeUrl: "https://rpc.ci-betanet.near.org",
          contractName: CONTRACT_NAME,
          masterAccount: "test.near",
        };
      default:
        throw Error(
          `Unconfigured environment '${env}'. Can be configured in src/config.js.`
        );
    }
  },
};
