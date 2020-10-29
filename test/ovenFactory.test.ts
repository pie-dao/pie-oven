import { ethers } from "hardhat";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

describe("ovenFactory", function () {
  let ovenFactory : any;
  let owner : any;
  let recipe : any;
  let pool : any;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const OvenFactoryContract = await ethers.getContractFactory(
      "OvenFactoryContract"
    );

    const TestPieRecipe = await ethers.getContractFactory(
        "TestPieRecipe"
    );
    recipe = await TestPieRecipe.deploy();
    await recipe.deployed();

    const TestPie = await ethers.getContractFactory(
        "TestPie"
      );
    pool = await TestPie.deploy(parseEther("10000000000"), recipe.address);
    await pool.deployed();

    ovenFactory = await OvenFactoryContract.deploy();
    await ovenFactory.deployed();
  });

  it("Initial state", async function () {
    expect(await ovenFactory.defaultController()).to.be.eq(ZERO_ADDRESS);
  });
  it("Set addresses", async function () {
    await ovenFactory.setDefaultController(await owner.getAddress());

    expect(await ovenFactory.defaultController()).to.be.eq(await owner.getAddress());
  });
  it("Create oven, no controller", async function () {
    await expect(ovenFactory.CreateEmptyOven()).to.be.revertedWith("CONTROLLER_NOT_SET");
  });
  it("Create empty oven", async function () {
    await ovenFactory.setDefaultController(await owner.getAddress());

    const tx = await ovenFactory.CreateEmptyOven()
    const receipt = await tx.wait()
    const oven = receipt.events[0].args.Oven;
    expect(receipt.events[0].args.Controller).to.be.eq(await owner.getAddress());
    expect(receipt.events[0].args.Pie).to.be.eq(ZERO_ADDRESS);
    expect(receipt.events[0].args.Recipe).to.be.eq(ZERO_ADDRESS)

    expect(await ovenFactory.isOven(oven)).to.be.eq(true);
    expect(await ovenFactory.ovens(0)).to.be.eq(oven);

    const ovenContract = await ethers.getContractAt("Oven", oven);
    expect(await ovenContract.getCap()).to.be.eq(ethers.BigNumber.from("2").pow(256).sub(1))
    expect(await ovenContract.controller()).to.be.eq(await owner.getAddress())
    expect(await ovenContract.pie()).to.be.eq(ZERO_ADDRESS)
    expect(await ovenContract.recipe()).to.be.eq(ZERO_ADDRESS)
  });
  it("Create oven with pie", async function () {
    await ovenFactory.setDefaultController(await owner.getAddress());

    const tx = await ovenFactory.CreateOven(pool.address, recipe.address)
    const receipt = await tx.wait()
    const oven = receipt.events[0].args.Oven;
    expect(receipt.events[0].args.Controller).to.be.eq(await owner.getAddress());
    expect(receipt.events[0].args.Pie).to.be.eq(pool.address);
    expect(receipt.events[0].args.Recipe).to.be.eq(recipe.address)

    expect(await ovenFactory.isOven(oven)).to.be.eq(true);
    expect(await ovenFactory.ovens(0)).to.be.eq(oven);

    const ovenContract = await ethers.getContractAt("Oven", oven);
    expect(await ovenContract.getCap()).to.be.eq(ethers.BigNumber.from("2").pow(256).sub(1))
    expect(await ovenContract.controller()).to.be.eq(await owner.getAddress())
    expect(await ovenContract.pie()).to.be.eq(pool.address)
    expect(await ovenContract.recipe()).to.be.eq(recipe.address)
  });
});