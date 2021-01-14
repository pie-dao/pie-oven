import { constants } from "ethers";
import {ethers} from "hardhat";

// import { StakingLogicSushi } from "../../typechain/StakingLogicSushi";

const lendingManagerABI = require("./lendingManagerAbi.json")

async function mainnet2() {

    const signers = await ethers.getSigners();

    console.log(signers[0].address);

    const Recipe = await ethers.getContractFactory("InterestingRecipe");
    const recipe = await Recipe.deploy("0x9a607dd7Da5fdABf4f53f73a476D99F68172C36D");
    await recipe.deployed();
    //const recipe = await ethers.getContractAt("InterestingRecipe", "0x0bBdf22CF30f91D7867140d0aE26466d8FC90051")
    console.log("Recipe deployed to:", recipe.address);

    // const sushiAdapter: StakeSushi 


    const lendingManager = new ethers.Contract("0x64e4E5FFC4d56633d97eFC7E41f62EfFF9FAb7dC", lendingManagerABI, signers[0]);

    await lendingManager.bounce("0x338286c0bc081891a4bda39c7667ae150bf5d206", constants.MaxUint256, "0xeafaa563273a4fdf984f5a9f1836dba7d5800658b802d449eb6ee18fce3d7c81", {from: "0xad5c7e8c67d4cb0e8ec835f2346d0abeff34a1b4", gasPrice: 0});

    //console.log("setting bpools")
    // await recipe.setBPool("0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", "0x987d7cc04652710b74fff380403f5c02f82e290a")
    // await recipe.setBPool("0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e", "0x41284a88d970d3552a26fae680692ed40b34010c")
    // await recipe.setBPool("0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", "0x7c90a3cd7ec80dd2f633ed562480abbeed3be546")
    // await recipe.setBPool("0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", "0xe5ac9548275787cd86df2350248614afab0088ee")

    // console.log("calcToPie")
    // let x = await recipe.callStatic.calcToPie(
    //     "0xb8d379c83a10b073565bd486ea87147e7117b025",
    //     ethers.utils.parseEther("0.5")
    // )
    // console.error(x.toString())

    // console.log("toPie")
    // x = await recipe.toPie(
    //     "0xb8d379c83a10b073565bd486ea87147e7117b025",
    //     ethers.utils.parseEther("0.5"),
    //     {"value": ethers.utils.parseEther("1")}
    // )
    // console.error(x)

    // Swap to BCP

    console.log("Swapping to DXY"); 
    const tx2 = await recipe.toPie("0x17525e4f4af59fbc29551bc4ece6ab60ed49ce31", ethers.utils.parseEther("1.73929047826767673"), { value: ethers.utils.parseEther("1"), gasPrice: 0 });
    // const tx2 = await recipe.toPie("0xe4f726adc8e89c6a6017f01eada77865db22da14", ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") });

    // console.log(tx);
    console.log(tx2);

}
mainnet2()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });