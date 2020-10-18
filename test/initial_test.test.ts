const { ethers } = require("@nomiclabs/buidler");
const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");

const States = {
  PREPARE: 0,
  BAKE: 1,
  MUNCH: 2,
};

describe("Oven happy flow", function () {
  let pool : any;
  let recipe : any;
  let owner : any;
  let oven : any;

  before(async function () {
    [owner] = await ethers.getSigners();
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
  });

  it("Should deploy oven", async function () {
    const Oven = await ethers.getContractFactory("Oven");
    oven = await Oven.deploy(owner.getAddress(), pool.address, recipe.address);
    oven.deployed();

    expect(await oven.getCap()).to.be.eq(0);
    await oven.setCap(parseEther("100"))
    expect(await oven.getCap()).to.be.eq(parseEther("100"));
  });
  it("Deposit", async function () {
    await expect(await oven.ethBalanceOf(owner.getAddress())).to.be.eq(0);

    await owner.sendTransaction({
      to: oven.address,
      value:parseEther("1.0")
    });
    await oven.deposit({ value: parseEther("1") });

    await expect(await oven.ethBalanceOf(owner.getAddress())).to.be.eq(parseEther("2"));
  });
  it("Withdraw ETH", async function () {
    await oven.withdrawETH(parseEther("1"), owner.getAddress())

    await expect(await oven.ethBalanceOf(owner.getAddress())).to.be.eq(parseEther("1"));

 });
  it("Starts exchanging", async function () {
    await expect(await oven.ethBalanceOf(owner.getAddress())).to.be.eq(parseEther("1"));
    await expect(await oven.outputBalanceOf(owner.getAddress())).to.be.eq(parseEther("0"));

    await oven.bake([owner.getAddress()], [parseEther("1")], parseEther("1"), parseEther("2"));

    await expect(await oven.ethBalanceOf(owner.getAddress())).to.be.eq(parseEther("0"));
    await expect(await oven.outputBalanceOf(owner.getAddress())).to.be.eq(parseEther("1"));
 });
  it("Withdraw Output", async function () {

    await expect(await oven.outputBalanceOf(owner.getAddress())).to.be.eq(parseEther("1"));
    await expect(await pool.balanceOf(owner.getAddress())).to.be.eq(parseEther("0"))
    await oven.withdrawOutput(parseEther("1"), owner.getAddress())
    await expect(await oven.outputBalanceOf(owner.getAddress())).to.be.eq(parseEther("0"));
    await expect(await pool.balanceOf(owner.getAddress())).to.be.eq(parseEther("1"))
  });
});
