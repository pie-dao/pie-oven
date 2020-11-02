async function rate() {
    const cEthAddress = "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5";

    const cEth = await ethers.getContractAt("ICompoundCToken", cEthAddress);
    const rate = await cEth.exchangeRateCurrent()

    console.log("Rate", rate.toString());
  }

rate()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
