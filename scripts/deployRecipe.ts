async function recipePublish() {
    const Recipe = await ethers.getContractFactory("InterestingRecipe");
    const recipe = await Recipe.deploy();
    await recipe.deployed();

    console.log("Recipe deployed to:", recipe.address);
  }

recipePublish()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
