async function mainnet2() {
    const Recipe = await ethers.getContractFactory("InterestingRecipe");
    const recipe = await Recipe.deploy();
    await recipe.deployed();
    //const recipe = await ethers.getContractAt("InterestingRecipe", "0x0bBdf22CF30f91D7867140d0aE26466d8FC90051")
    console.log("Recipe deployed to:", recipe.address);

    // MKR      0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2,
    // YFI	    0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e,
    // AAVE	    0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9,
    // aLINK	  0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84,
    // SNX	    0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F,
    // cCOMP	  0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4,
    // cUNI	    0x35A18000230DA775CAc24873d00Ff85BccdeD550

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

    console.log("Updating compound identifier")
    tx = await recipe.updateProtocolIdentifier(COMPTROLLER, COMPOUND_IDENTIFIER)

    console.log("Updating mapping")
    tx = await recipe.updateMapping(
      [
        "0xba3D9687Cf50fE253cd2e1cFeEdE1d6787344Ed5",
        //"0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4",
       "0x35A18000230DA775CAc24873d00Ff85BccdeD550"
      ],
      [
        "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
       // "0xc00e94cb662c3520282e6f5717214004a7f26888",
       "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"
      ],
      [
        AAVE_LP_ADDRESS_PROVIDER,
        //COMPTROLLER,
       COMPTROLLER
      ]
    )

    //console.log("setting bpools")
    // await recipe.setBPool("0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", "0x987d7cc04652710b74fff380403f5c02f82e290a")
    // await recipe.setBPool("0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e", "0x41284a88d970d3552a26fae680692ed40b34010c")
    // await recipe.setBPool("0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", "0x7c90a3cd7ec80dd2f633ed562480abbeed3be546")
    // await recipe.setBPool("0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", "0xe5ac9548275787cd86df2350248614afab0088ee")

    console.log("calcToPie")
    let x = await recipe.callStatic.calcToPie(
        "0xb8d379c83a10b073565bd486ea87147e7117b025",
        ethers.utils.parseEther("0.5")
    )
    console.error(x.toString())

    console.log("toPie")
    x = await recipe.toPie(
        "0xb8d379c83a10b073565bd486ea87147e7117b025",
        ethers.utils.parseEther("0.5"),
        {"value": ethers.utils.parseEther("1")}
    )
    console.error(x)


}
mainnet2()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
