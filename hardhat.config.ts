require('dotenv').config()

import { task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";

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

    let addresses: string[] = []
    let inputAmount = ethers.BigNumber.from("0")

    const oven = await ethers.getContractAt("Oven", taskArgs.oven);
    const pie_address = await oven.pie();
    const recipe_address = await oven.recipe();
    const recipe = await ethers.getContractAt("TestPieRecipe", recipe_address);
    console.log("\tUsing pie @", pie_address);
    console.log("\n~Getting addresses~")
    const deposits = await oven.queryFilter(oven.filters.Deposit(), taskArgs.startBlock, "latest")
    for(const deposit of deposits) {
        // @ts-ignore
        const user = deposit.args.user;
        const balance = await oven.ethBalanceOf(user);
        if (addresses.includes(user)) {
            continue
        }

        if (balance.lt(taskArgs.minDeposit)) {
            console.log("Skipping", user,"(", balance.toString(), ")...")
            continue
        }
        console.log("Adding", user, "(", balance.toString(), ")...")
        addresses.push(user)
        inputAmount = inputAmount.add(ethers.BigNumber.from(balance))

        if (addresses.length >= taskArgs.maxAddress) {
            console.log("Max addressess reached, continuing..")
            break
        }
    }
    if (addresses.length < taskArgs.minAddress) {
        throw new Error("Addressess is less than min_addresses")
    }
    console.log("~Done getting addresses~\n")
    console.log("Calculating output amount...")
    const etherJoinAmount = await recipe.calcToPie(pie_address, ethers.utils.parseEther("1"));
    const outputAmount =  inputAmount.mul(ethers.utils.parseEther("1")).div(etherJoinAmount).div(100).mul(100-taskArgs.slippage);
    console.log("Swapping", inputAmount.toString(), "for", outputAmount.toString())

    console.log("Start baking...")

    const call = oven.interface.encodeFunctionData("bake", [addresses, outputAmount, inputAmount])

    console.log("\n\nCalldata:\n\n", call)
    // const baketx = await oven.bake(
    //    addresses,
    //    outputAmount,
    //    inputAmount,
    //    {
    //        gasLimit: 5000000
    //    }
    // )
    // console.log("Baking in process @", baketx.hash)
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
