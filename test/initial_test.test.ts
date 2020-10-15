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
  let owner : any;
  let oven : any;

  before(async function () {
    [owner] = await ethers.getSigners();
    const TestUniswapExchange = await ethers.getContractFactory(
      "TestUniswapExchange"
    );
    pool = await TestUniswapExchange.deploy();
    await pool.deployed();
  });

  it("Should deploy oven", async function () {
    const Oven = await ethers.getContractFactory("Oven");
    oven = await Oven.deploy(owner.getAddress(), pool.address);
    oven.deployed();

    expect(await oven.getMaxCap()).to.be.eq(0);
    await oven.setMaxCap(parseEther("100"))
    expect(await oven.getMaxCap()).to.be.eq(parseEther("100"));
  });
  it("Join pool", async function () {
    await expect(await oven.getStake(owner.getAddress())).to.be.eq(0);
    await expect(await oven.getTotalValue()).to.be.eq(0);
    await expect(await oven.getState()).to.be.eq(States.PREPARE);

    await owner.sendTransaction({
      to: oven.address,
      value:parseEther("1.0")
    });
    await oven.deposit({ value: parseEther("1") });

    await expect(await oven.getStake(owner.getAddress())).to.be.eq(
      parseEther("2")
    );
    await expect(await oven.getTotalValue()).to.be.eq(parseEther("2"));
  });
  it("Exit pool partially", async function () {
    await oven.withdraw(parseEther("1"))

    await expect(await oven.getStake(owner.getAddress())).to.be.eq(
      parseEther("1")
    );
    await expect(await oven.getTotalValue()).to.be.eq(parseEther("1"));
  });
  it("Starts exchanging", async function () {
    await expect(await oven.getFinalTotalValue()).to.be.eq(parseEther("0"));
    await oven.setStateBake();
    await expect(await oven.getState()).to.be.eq(States.BAKE);
    await expect(await oven.getFinalTotalValue()).to.be.eq(parseEther("1"));

    await expect(await oven.getTotalTokensClaimable()).to.be.eq(
      parseEther("0")
    );

    await oven.execute(parseEther("0.6"), parseEther("1.2"), 0);

    await expect(await oven.getTotalTokensClaimable()).to.be.eq(
      parseEther("1.2")
    );
    await expect(await oven.getTotalValue()).to.be.eq(parseEther("0.4"));
  });
  it("Finish exchanging", async function () {
    await oven.execute(parseEther("0.4"), parseEther("0.8"), 0);
    await expect(await oven.getTotalTokensClaimable()).to.be.eq(
      parseEther("2")
    );
    await expect(await oven.getTotalValue()).to.be.eq("0");
    await expect(await oven.getFinalTotalTokensClaimable()).to.be.eq(
      parseEther("0")
    );
    await oven.setStateMunch();
    await expect(await oven.getFinalTotalTokensClaimable()).to.be.eq(
      parseEther("2")
    );
    await expect(await oven.getState()).to.be.eq(States.MUNCH);
  });
  it("Claim", async function () {
    let balance = await pool.balanceOf(owner.getAddress());
    await expect(balance).to.be.eq("0");
    await oven.claim(owner.getAddress());
    balance = await pool.balanceOf(owner.getAddress());
    await expect(balance).to.be.eq(parseEther("2"));
    await expect(await oven.getTotalTokensClaimable()).to.be.eq(
      parseEther("0")
    );
    await expect(await oven.getFinalTotalTokensClaimable()).to.be.eq(
      parseEther("2")
    );
  });
  it("Start deposit state", async function () {
    await oven.setStatePrepare();
    await expect(await oven.getState()).to.be.eq(States.PREPARE);
    await expect(await oven.getTotalTokensClaimable()).to.be.eq("0");
    await expect(await oven.getFinalTotalTokensClaimable()).to.be.eq("0");
    await expect(await oven.getTotalValue()).to.be.eq("0");
    await expect(await oven.getFinalTotalValue()).to.be.eq("0");
  });
});
