const homedir = require("os").homedir();
const fs = require("fs");
const path = require("path");
const nearApi = require("near-api-js");
const {getConfig} = require("./config");
const {notify} = require("./utils/notification");


const nearConfig = getConfig(process.env.NODE_ENV || "development");
const CREDENTIALS_DIR =
  nearConfig.networkId === "mainnet"
    ? ".near-credentials/mainnet/"
    : ".near-credentials/testnet/";
const GAS = "50000000000000";

module.exports = {
  NearView: async function (contract, operation, parameters) {
    const nearRpc = new nearApi.providers.JsonRpcProvider(nearConfig.nodeUrl);
    const account = new nearApi.Account({ provider: nearRpc });

    const view = await account.viewFunction(contract, operation, parameters);

    return view;
  },

  NearCall: async function (account_id, contract, operation, parameters) {
    try {
      const privateKey = await GetPrivateKey(account_id);

      const keyPair = nearApi.utils.KeyPair.fromString(privateKey);
      const keyStore = new nearApi.keyStores.InMemoryKeyStore();
      keyStore.setKey("default", account_id, keyPair);

      const near = await nearApi.connect({
        networkId: "default",
        deps: { keyStore },
        masterAccount: account_id,
        nodeUrl: nearConfig.nodeUrl,
      });

      const account = await near.account(account_id);

      const call = await account.functionCall({
        contractId: contract,
        methodName: operation,
        args: parameters,
        gas: GAS,
        attachedDeposit: "0",
      });

      if (call["status"].hasOwnProperty("SuccessValue")) {
        let logs = [];
        call["receipts_outcome"].map((receipts_outcome) => {
          if (receipts_outcome ?? ["outcome"] ?? ["logs"].length)
            receipts_outcome["outcome"]["logs"].map((log) => logs.push(log));
        });
        console.log(`Successful operation: ${operation}!\n\r${logs.join("\n\r")}`);
      } else {
        return notify(`Failed operation: ${operation}`);
      }
    } catch (e) {
      console.log(e.message);
      return notify(`Call processed with unknown result: ${e.message}`);
    }
  },
};

const GetPrivateKey = async function (account_id) {
  const credentialsPath = path.join(homedir, CREDENTIALS_DIR);
  const keyPath = credentialsPath + account_id + ".json";
  try {
    const credentials = JSON.parse(fs.readFileSync(keyPath));
    return credentials.private_key;
  } catch (e) {
    throw new Error(
      "Key not found for account " + keyPath + ". Error: " + e.message
    );
  }
};
