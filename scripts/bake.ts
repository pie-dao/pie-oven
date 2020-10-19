const bre = require("@nomiclabs/buidler");
const utils = bre.ethers.utils;


const minAmount = utils.parseEther("0.1");
const max_addresses = 10;
const outputAmount = utils.parseEther("100")
const maxPrice = utils.parseEther("1")

const oven_address = "0x4f76c4138a679384b3917be82bcc76568946bd3c";
const start_block = 3604155



async function bake() {
    const ethers = bre.ethers;
    console.log("Min amount to bake:", minAmount.toString())
    console.log("Max addresses", max_addresses)
    console.log("Output amont", outputAmount.toString())
    console.log("Max price", maxPrice.toString())

    console.log("Using oven @", oven_address);
    console.log("Start block @", start_block);

    let addresses = []
    let amounts = []
    let currentInputAmount = ethers.BigNumber.from("0")

    const oven = await ethers.getContractAt("Oven", oven_address);
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
        amounts.push(balance)
        currentInputAmount = currentInputAmount.add(ethers.BigNumber.from(balance))

        if (addresses.length > max_addresses) {
            throw new Error("Exceeding max addresses");
        }
        if (currentInputAmount.gte(maxPrice)) {
            console.log("Max price reached, continuing..")
            break
        }
    }
    if (currentInputAmount.lt(maxPrice)) {
        console.log(currentInputAmount, maxPrice.toString())
        throw new Error("Not enough balance to continue");
    }
    console.log("start baking...")
    const baketx = await oven.bake(
       addresses,
       amounts,
       outputAmount,
       maxPrice,
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
