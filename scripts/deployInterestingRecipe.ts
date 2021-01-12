import { parseEther } from "ethers/lib/utils";
import {ethers} from "hardhat";
import { InterestingRecipe } from "../typechain/InterestingRecipe";

async function recipePublish() {
    const Recipe = await ethers.getContractFactory("InterestingRecipe");
    const lendingRegistry = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    const pie = "0x17525e4f4af59fbc29551bc4ece6ab60ed49ce31"

    const recipe = await Recipe.deploy(lendingRegistry) as InterestingRecipe;
    await recipe.deployed();
    console.log("Recipe deployed to:", recipe.address);

    const amount = await recipe.callStatic.calcToPie(pie, parseEther("3"))
    console.log("Wei to join", amount.toString())

    const tx = await recipe.toPie(pie, parseEther("3"), {value: parseEther("1")})
    const receipt =  await tx.wait();
    console.log(receipt)
  }

recipePublish()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
