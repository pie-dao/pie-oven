const hre = require("hardhat");
const utils = hre.ethers.utils;


const minAmount = utils.parseEther("0.1");
const min_addresses = 2;
const max_addresses = 6;
const slippage = 3; // max 3%


const oven_address = "0x26fC22e1A99d4FFb5e0C6Ad33a7b9319958910E6";
const start_block = 3604155

async function bake() {
    const ethers = hre.ethers;
    console.log("Settings")
    console.log("\tMin amount to bake:", minAmount.toString())
    console.log("\tMin addresses", min_addresses)
    console.log("\tMax addresses", max_addresses)
    console.log("\tUsing oven @", oven_address);
    console.log("\tStart block @", start_block);

    let addresses = []
    let inputAmount = ethers.BigNumber.from("0")

    const oven = await ethers.getContractAt("Oven", oven_address);
    const pie_address = await oven.pie();
    const recipe_address = await oven.recipe();
    const recipe = await ethers.getContractAt("TestPieRecipe", recipe_address);
    console.log("\tUsing pie @", pie_address);
    console.log("\n~Getting addresses~")
    const deposits = await oven.queryFilter(oven.filters.Deposit(), start_block, "latest")
    for(const deposit of deposits) {
        const user = deposit.args.user;
        const balance = await oven.ethBalanceOf(user);
        if (balance.lt(minAmount)) {
            console.log("Skipping", user,"(", balance.toString(), ")...")
            continue
        }
        console.log("Adding", user, "(", balance.toString(), ")...")
        addresses.push(user)
        inputAmount = inputAmount.add(ethers.BigNumber.from(balance))

        if (addresses.length >= max_addresses) {
            console.log("Max addressess reached, continuing..")
            break
        }
    }
    if (addresses.length < min_addresses) {
        throw new Error("Addressess is less than min_addresses")
    }
    console.log("~Done getting addresses~\n")
    console.log("Calculating output amount...")
    const etherJoinAmount = await recipe.calcToPie(pie_address, utils.parseEther("1"));
    const outputAmount =  inputAmount.mul(utils.parseEther("1")).div(etherJoinAmount).div(100).mul(100-slippage);
    console.log("Swapping", inputAmount.toString(), "for", outputAmount.toString())

    console.log("Start baking...")
    const baketx = await oven.bake(
       addresses,
       outputAmount,
       inputAmount,
       {
           gasLimit: 5000000
       }
    )
    console.log("Baking in process @", baketx.hash)
}

bake()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
