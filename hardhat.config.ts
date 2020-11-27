import { task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import { bake } from './scripts/bake';

require('dotenv').config()
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY || "";
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY || "";
const ETHERSCAN_API = process.env.ETHERSCAN_API || "";

// This is a sample Buidler task. To learn how to create your own go to
// https://buidler.dev/guides/create-task.html
task("accounts", "Prints the list of accounts")
.setAction(async(taskArgs, { ethers, run }) =>  {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.getAddress());
  }
});

task("env", "Prints env keys")
.setAction(async(taskArgs, { ethers, run }) =>  {
    console.log("Infura:", INFURA_API_KEY)
    console.log("mainnet:", MAINNET_PRIVATE_KEY)
    console.log("goerli:", GOERLI_PRIVATE_KEY)
    console.log("etherscan:", ETHERSCAN_API)
});

task("bot", "Run bots")
.setAction(async(taskArgs, { ethers, run }) =>  {
    console.log("Infura:", INFURA_API_KEY)
    console.log("mainnet:", MAINNET_PRIVATE_KEY)
    console.log("goerli:", GOERLI_PRIVATE_KEY)
    console.log("etherscan:", ETHERSCAN_API)
});


task("bake", "Generate call data for bake function")
.addParam("minDeposit", "minimal deposit of a user (in wei)")
.addParam("minAddress", "minimal amount of addressess to include")
.addParam("maxAddress", "max amount of addressess to include")
.addParam("slippage", "max percentage slippage, 1 = 1%")
.addParam("oven", "Address of the oven")
.addParam("startBlock", "Starting block to track deposits")
.setAction(async(taskArgs, { ethers, run }) =>  {
    console.log("Settings")
    console.log("\tMin amount to bake:", taskArgs.minDeposit.toString())
    console.log("\tMin addresses", taskArgs.minAddress)
    console.log("\tMax addresses", taskArgs.maxAddress)
    console.log("\tUsing oven @", taskArgs.oven);
    console.log("\tStart block @", taskArgs.startBlock);

    taskArgs.minDeposit = ethers.BigNumber.from(taskArgs.minDeposit)
    taskArgs.minAddress = parseInt(taskArgs.minAddress)
    taskArgs.maxAddress = parseInt(taskArgs.maxAddress)
    taskArgs.startBlock = parseInt(taskArgs.startBlock)
    taskArgs.slippage = parseInt(taskArgs.slippage)

    let addresses = []
    const res = await bake(
      taskArgs.oven, 
      taskArgs.startBlock,
      taskArgs.slippage,
      taskArgs.maxAddress,
      taskArgs.minAddress,
      taskArgs.minDeposit
    );

    console.log('res', res);
});


// You have to export an object to set up your config
// This object can have the following optional entries:
// defaultNetwork, networks, solc, and paths.
// Go to https://buidler.dev/config/ to learn more
export default {
  // This is a sample solc configuration that specifies which version of solc to use
  solidity: {
    compilers: [
      {
        version: "0.6.4"
      },
      {
        version: "0.7.1"
      }
    ]
  },
  networks: {
    fork : {
      url: `http://127.0.0.1:8545/`,
      gasPrice: 86000000000,
      accounts: [
        MAINNET_PRIVATE_KEY
      ].filter((item) => item !== ""),
      timeout: 2483647
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      gasPrice: 90000000000,
      accounts: [
        MAINNET_PRIVATE_KEY,
      ].filter((item) => item !== "")
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
      gasPrice: 20000000000,
      accounts: [
        GOERLI_PRIVATE_KEY,
      ].filter((item) => item !== "")
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API
  }
};
