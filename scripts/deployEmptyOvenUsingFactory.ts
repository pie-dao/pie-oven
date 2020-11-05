async function deployEmptyOvenUsingFactory() {
    // use env files for this?
    const OvenFactoryAddress = "0x4a1d8455A2fEF2C922865A9988a2d617FEad4fF9"

    const OvenFactory = await ethers.getContractAt("OvenFactoryContract", OvenFactoryAddress);
    const tx = await OvenFactory.CreateEmptyOven();
    const txData = await tx.wait()
    const OvenAddress = txData.events[0].args.Oven

    console.log("Oven deployed to:", OvenAddress);
    console.log("Please RUN:")
    console.log(
        "npx hardhat verify --network {network}",
        OvenAddress,
        OvenFactoryAddress,
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000"
    )
  }

deployEmptyOvenUsingFactory()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
