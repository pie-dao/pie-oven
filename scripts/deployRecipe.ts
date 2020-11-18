async function recipePublish() {
    const Recipe = await ethers.getContractFactory("InterestingRecipe");
    const recipe = await Recipe.deploy();
    await recipe.deployed();
    //const recipe = await ethers.getContractAt("InterestingRecipe", "0x0bBdf22CF30f91D7867140d0aE26466d8FC90051")
    console.log("Recipe deployed to:", recipe.address);

    // aAAVE  0xba3D9687Cf50fE253cd2e1cFeEdE1d6787344Ed5 --> 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9
    // aLINK	0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84 --> 0x514910771af9ca656af840dff83e8264ecf986ca
    // cCOMP	0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4 --> 0xc00e94cb662c3520282e6f5717214004a7f26888
    // cUNI	  0x35A18000230DA775CAc24873d00Ff85BccdeD550 --> 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
    const AAVE_IDENTIFIER = await ethers.utils.keccak256(ethers.utils.toUtf8Bytes("aave.protocol"))
    const COMPOUND_IDENTIFIER = await ethers.utils.keccak256(ethers.utils.toUtf8Bytes("compound.protocol"))

    const AAVE_LP_ADDRESS_PROVIDER = "0x24a42fD28C976A61Df5D00D0599C34c4f90748c8"
    const COMPTROLLER = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b"

    console.log("Updating aave identifier")
    let tx = await recipe.updateProtocolIdentifier(AAVE_LP_ADDRESS_PROVIDER, AAVE_IDENTIFIER)
    await tx.wait()

    console.log("Updating compound identifier")
    tx = await recipe.updateProtocolIdentifier(COMPTROLLER, COMPOUND_IDENTIFIER)
    await tx.wait()

    console.log("Updating mapping")
    tx = await recipe.updateMapping(
      [
        "0xba3D9687Cf50fE253cd2e1cFeEdE1d6787344Ed5",
        "0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84",
        "0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4",
        "0x35A18000230DA775CAc24873d00Ff85BccdeD550"
      ],
      [
        "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
        "0x514910771af9ca656af840dff83e8264ecf986ca",
        "0xc00e94cb662c3520282e6f5717214004a7f26888",
        "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
      ],
      [
        AAVE_LP_ADDRESS_PROVIDER,
        AAVE_LP_ADDRESS_PROVIDER,
        COMPTROLLER,
        COMPTROLLER
      ]
    )

    console.log("calcToPie")
    let x = await recipe.callStatic.calcToPie(
        "0xb8d379c83a10b073565bd486ea87147e7117b025",
        ethers.utils.parseEther("0.5")
    )
    console.error(x.toString())

    // console.log("toPie")
    // x = await recipe.toPie(
    //     "0xb8d379c83a10b073565bd486ea87147e7117b025",
    //     ethers.utils.parseEther("0.5"),
    //     {"value": ethers.utils.parseEther("1")}
    // )
    // console.error(x)
  }

recipePublish()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
