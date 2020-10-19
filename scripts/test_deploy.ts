

async function main() {
    const bre = require("@nomiclabs/buidler");
    const utils = bre.ethers.utils;
    const signer = "0xD4Ae0DD720f1690AB506A22c6e7da6408c5e2313";

    const TestPieRecipe = await ethers.getContractFactory(
      "TestPieRecipe"
    );
    const recipe = await TestPieRecipe.deploy();
    await recipe.deployed();

    const TestPie = await ethers.getContractFactory(
      "TestPie"
    );
    const pool = await TestPie.deploy(utils.parseEther("10000000000").address);
    await pool.deployed();

    const Oven = await ethers.getContractFactory("Oven");
    const oven = await Oven.deploy(signer, pool.address, recipe.address);
    await oven.deployed();

    console.log("Oven deployed to:", oven.address);
  }

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
