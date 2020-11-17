async function mainnet() {
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0x4cf5F3EcD6303F6a04480F75ac394D4bB3816F83"]}
    )

    // MKR      0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2,
    // YFI	    0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e,
    // AAVE	    0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9,
    // aLINK	0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84,
    // SNX	    0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F,
    // cCOMP	0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4,
    // cUNI	    0x35A18000230DA775CAc24873d00Ff85BccdeD550
    const recipe = await ethers.getContractAt("InterestingRecipe", "0x0bbdf22cf30f91d7867140d0ae26466d8fc90051")
    await recipe.setBPool("0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", "0x987d7cc04652710b74fff380403f5c02f82e290a")
    await recipe.setBPool("0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e", "0x41284a88d970d3552a26fae680692ed40b34010c")
    await recipe.setBPool("0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", "0x7c90a3cd7ec80dd2f633ed562480abbeed3be546")
    await recipe.setBPool("0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F", "0xe5ac9548275787cd86df2350248614afab0088ee")
    let x = await recipe.calcToPie(
        "0xb8d379c83a10b073565bd486ea87147e7117b025",
        ethers.utils.parseEther("0.5")
        //{"value": ethers.utils.parseEther("1")}
    )
    console.error(x)


}
mainnet()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
