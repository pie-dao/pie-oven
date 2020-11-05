async function deployOvenFactory() {
    const [owner,] = await ethers.getSigners();
    const OvenFactory = await ethers.getContractFactory("OvenFactoryContract");
    const oven = await OvenFactory.deploy();
    await oven.deployed();

    console.log("Oven Factory deployed to:", oven.address);

    await oven.setDefaultController(await owner.getAddress())

    console.log("Oven Factory controller set to:", await owner.getAddress());

    console.log("Please RUN:")
    console.log("npx hardhat verify --network {network}", oven.address)
  }

deployOvenFactory()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
