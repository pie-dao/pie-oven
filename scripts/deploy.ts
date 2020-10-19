async function main() {
    const controller = "0x4cf5F3EcD6303F6a04480F75ac394D4bB3816F83";
    const pie = "0x78f225869c08d478c34e5f645d07a87d3fe8eb78";
    const recipe = "0xca9aF520706A57CeCDE6f596852eaBb5a0e6bB0E";

    const Oven = await ethers.getContractFactory("Oven");
    const oven = await Oven.deploy(controller, pie, recipe);
    await oven.deployed();

    console.log("Oven deployed to:", oven.address);
  }

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
