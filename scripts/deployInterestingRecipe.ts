import { parseEther } from "ethers/lib/utils";
import {ethers} from "hardhat";
import { InterestingRecipe } from "../typechain/InterestingRecipe";

async function recipePublish() {
    const [account] = await ethers.getSigners()
    const Recipe = await ethers.getContractFactory("InterestingRecipe");
    const recipe = await Recipe.deploy("0x5FbDB2315678afecb367f032d93F642f64180aa3") as InterestingRecipe;
    await recipe.deployed();
    //const recipe = await ethers.getContractAt("InterestingRecipe", "0x0bBdf22CF30f91D7867140d0aE26466d8FC90051")

    console.log("Recipe deployed to:", recipe.address);

    const amount = await recipe.callStatic.calcToPie("0xb8d379c83A10b073565bD486Ea87147E7117B025", parseEther("3"))
    console.log("Wei to join", amount.toString())

    const tx = await recipe.toPie("0xb8d379c83A10b073565bD486Ea87147E7117B025", parseEther("3"), {value: parseEther("1")})
    const receipt =  await tx.wait();
    console.log(receipt)
  }

recipePublish()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
