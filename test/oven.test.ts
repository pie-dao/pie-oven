const { ethers } = require("hardhat");
const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");

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
    await oven.deployed();

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
    await recipe.testSetCalcToPieAmount(parseEther("1"))

    await expect(await oven.ethBalanceOf(owner.getAddress())).to.be.eq(parseEther("1"));
    await expect(await oven.outputBalanceOf(owner.getAddress())).to.be.eq(parseEther("0"));

    await oven.bake([owner.getAddress()], parseEther("1"), parseEther("2"));

    await expect(await oven.ethBalanceOf(owner.getAddress())).to.be.eq(parseEther("0"));
    await expect(await oven.outputBalanceOf(owner.getAddress())).to.be.eq(parseEther("1"));
 });
  it("Withdraw Output", async function () {

    await expect(await oven.outputBalanceOf(owner.getAddress())).to.be.eq(parseEther("1"));
    await expect(await pool.balanceOf(owner.getAddress())).to.be.eq(parseEther("0"))
    await oven.withdrawOutput(owner.getAddress())
    await expect(await oven.outputBalanceOf(owner.getAddress())).to.be.eq(parseEther("0"));
    await expect(await pool.balanceOf(owner.getAddress())).to.be.eq(parseEther("1"))
  });
});

describe("Test baking", function () {
  let pool : any;
  let recipe : any;
  let owner : any;
  let user1 : any;
  let user2 : any;
  let user3 : any;
  let oven : any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
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

    const Oven = await ethers.getContractFactory("Oven");
    oven = await Oven.deploy(owner.getAddress(), pool.address, recipe.address);
    await oven.deployed();

    await oven.setCap(parseEther("1000"));
    await oven.connect(user1).deposit({ value: parseEther("100") })
    await oven.connect(user2).deposit({ value: parseEther("100") })
    await oven.connect(user3).deposit({ value: parseEther("100") })
  });

  it("Non controller", async function () {
      await expect (
        oven.connect(user1).bake([owner.getAddress()], parseEther("1"), parseEther("2"))
      ).to.be.revertedWith("NOT_CONTROLLER")
  })
  it("Price too much", async function () {
    await recipe.testSetCalcToPieAmount(parseEther("50"))
    await expect (
      oven.bake([owner.getAddress()], parseEther("1"), parseEther("25"))
    ).to.be.revertedWith("PRICE_ERROR")
  })
  it("Total insufficient funds", async function () {
    // price needed
    await recipe.testSetCalcToPieAmount(parseEther("310"))

    await expect (
      oven.bake(
        [user1.getAddress(), user2.getAddress(), user3.getAddress()],
        parseEther("10"),
        parseEther("350")
      )
    ).to.be.revertedWith("INSUFFICIENT_FUNDS")
  })
  it("Success (exact)", async function () {
    // price needed
    await recipe.testSetCalcToPieAmount(parseEther("300"))
    const users = [user1, user2, user3];
    for(const user of users) {
      await expect(await oven.ethBalanceOf(user.getAddress())).to.be.eq(parseEther("100"));
      await expect(await oven.outputBalanceOf(user.getAddress())).to.be.eq(parseEther("0"));
    }

    await oven.bake(
      [user1.getAddress(), user2.getAddress(), user3.getAddress()],
      parseEther("30"),
      parseEther("300")
    )

    for(const user of users) {
      await expect(await oven.ethBalanceOf(user.getAddress())).to.be.eq(parseEther("0"));
      await expect(await oven.outputBalanceOf(user.getAddress())).to.be.eq(parseEther("10"));
    };

  })
  it("Success (too much)", async function () {
    // price needed
    await recipe.testSetCalcToPieAmount(parseEther("250"))
    const users = [user1, user2, user3];
    for(const user of users) {
      await expect(await oven.ethBalanceOf(user.getAddress())).to.be.eq(parseEther("100"));
      await expect(await oven.outputBalanceOf(user.getAddress())).to.be.eq(parseEther("0"));
    };

    await oven.bake(
      [user1.getAddress(), user2.getAddress(), user3.getAddress()],
      parseEther("30"),
      parseEther("300")
    )

    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("12"));

    await expect(await oven.ethBalanceOf(user2.getAddress())).to.be.eq(parseEther("0"));
    await expect(await oven.outputBalanceOf(user2.getAddress())).to.be.eq(parseEther("12"));

    await expect(await oven.ethBalanceOf(user3.getAddress())).to.be.eq(parseEther("50"));
    await expect(await oven.outputBalanceOf(user3.getAddress())).to.be.eq(parseEther("6"));
  })

})

describe("Test deposit/withdraw eth + cap", function () {
  let pool : any;
  let recipe : any;
  let owner : any;
  let user1 : any;
  let user2 : any;
  let user3 : any;
  let oven : any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
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

    const Oven = await ethers.getContractFactory("Oven");
    oven = await Oven.deploy(owner.getAddress(), pool.address, recipe.address);
    await oven.deployed();

    await oven.setCap(parseEther("1000"));
  });
  it("Exceeding cap", async function () {
    await expect(await oven.getCap()).to.be.eq(parseEther("1000"));
    await expect (
      oven.connect(user1).deposit({ value: parseEther("1100") })
    ).to.be.revertedWith("MAX_CAP")
  })
  it("Exceeding cap multi", async function () {
    await expect(await oven.getCap()).to.be.eq(parseEther("1000"));
    await oven.connect(user1).deposit({ value: parseEther("400") })
    await oven.connect(user2).deposit({ value: parseEther("400") })
    await expect (
      oven.connect(user3).deposit({ value: parseEther("400") })
    ).to.be.revertedWith("MAX_CAP")

    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("400"))
    await expect(await oven.ethBalanceOf(user2.getAddress())).to.be.eq(parseEther("400"))
    await expect(await oven.ethBalanceOf(user3.getAddress())).to.be.eq(parseEther("0"))
  })
  it("Deposit", async function () {
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"))
    await oven.connect(user1).deposit({ value: parseEther("100") })
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("100"))
    await oven.connect(user1).deposit({ value: parseEther("100") })
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("200"))
  })
  it("Deposit ether transfer", async function () {
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"))
    await user1.sendTransaction({
      to: oven.address,
      value:parseEther("100")
    });
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("100"))
    await user1.sendTransaction({
      to: oven.address,
      value:parseEther("100")
    });
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("200"))
  })
  it("Deposit and withdraw", async function () {

    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"))
    await oven.connect(user1).deposit({ value: parseEther("100") })
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("100"))

    await oven.connect(user1).withdrawETH(parseEther("10"), user2.getAddress());
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("90"))

    // TODO validate user2 eth balance
  })
});

describe("Test withdraw output", function () {

  let pool : any;
  let recipe : any;
  let owner : any;
  let user1 : any;
  let user2 : any;
  let user3 : any;
  let oven : any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
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

    const Oven = await ethers.getContractFactory("Oven");
    oven = await Oven.deploy(owner.getAddress(), pool.address, recipe.address);
    await oven.deployed();

    await oven.setCap(parseEther("1000"));
    await oven.connect(user1).deposit({ value: parseEther("100") })

    await recipe.testSetCalcToPieAmount(parseEther("90"))
    await oven.bake(
      [user1.getAddress()],
      parseEther("100"),
      parseEther("100")
    )
  });
  it("Withdraw", async function () {
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("10"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("100"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("0"));

    await oven.connect(user1).withdrawOutput(user1.getAddress())

    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("10"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("100"));
  })
  it("Withdraw couple times", async function () {
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("10"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("100"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("0"));

    await oven.connect(user1).withdrawOutput(user1.getAddress())

    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("10"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("100"));

    await oven.connect(user1).withdrawOutput(user1.getAddress())

    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("10"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("100"));

  })
  it("Withdraw to other ussr", async function () {
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("10"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("100"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("0"));

    await expect(await oven.ethBalanceOf(user2.getAddress())).to.be.eq(parseEther("0"));
    await expect(await oven.outputBalanceOf(user2.getAddress())).to.be.eq(parseEther("0"));
    await expect(await pool.balanceOf(user2.getAddress())).to.be.eq(parseEther("0"));

    await oven.connect(user1).withdrawOutput(user2.getAddress())

    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("10"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("0"));

    await expect(await oven.ethBalanceOf(user2.getAddress())).to.be.eq(parseEther("0"));
    await expect(await oven.outputBalanceOf(user2.getAddress())).to.be.eq(parseEther("0"));
    await expect(await pool.balanceOf(user2.getAddress())).to.be.eq(parseEther("100"));
  })
  it("Withdraw all", async function () {
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("10"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("100"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("0"));

    await oven.connect(user1).withdrawAll(user1.getAddress())

    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("100"));
  })
  it("Withdraw all ETH", async function () {
    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("10"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("100"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("0"));

    await oven.connect(user1).withdrawAllETH(user1.getAddress())

    await expect(await oven.ethBalanceOf(user1.getAddress())).to.be.eq(parseEther("0"));
    await expect(await oven.outputBalanceOf(user1.getAddress())).to.be.eq(parseEther("100"));
    await expect(await pool.balanceOf(user1.getAddress())).to.be.eq(parseEther("0"));
  })
});

describe("Test controller functions", function () {
  let pool : any;
  let recipe : any;
  let owner : any;
  let user1 : any;
  let user2 : any;
  let user3 : any;
  let oven : any;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
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

    const Oven = await ethers.getContractFactory("Oven");
    oven = await Oven.deploy(owner.getAddress(), pool.address, recipe.address);
    await oven.deployed();
  });
  it("Bake restriction", async function () {
    await expect (
      oven.connect(user1).bake([owner.getAddress()], parseEther("1"), parseEther("2"))
    ).to.be.revertedWith("NOT_CONTROLLER")
  })
  it("Cap restriction", async function () {
    await expect (
      oven.connect(user1).setCap(parseEther("1"))
    ).to.be.revertedWith("NOT_CONTROLLER")
  })
  it("Set controller restriction", async function () {
    const user1Addr = await user1.getAddress();
    await expect (
      oven.connect(user1).setController(user1Addr)
    ).to.be.revertedWith("NOT_CONTROLLER")
  })
  it("Set controller", async function () {
    const ownerAddr = await owner.getAddress();
    const user1Addr = await user1.getAddress();
    await expect(await oven.controller()).to.be.eq(ownerAddr);
    await oven.setController(user1.getAddress())
    await expect(await oven.controller()).to.be.eq(user1Addr);
  })
});