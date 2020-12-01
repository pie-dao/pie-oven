import { ethers, network } from "hardhat";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { Signer, constants } from "ethers";
import { TestPieRecipe } from "../typechain/TestPieRecipe";
import { Oven } from "../typechain/Oven";
import { OvenFactoryContractFactory, OvenFactory } from "../typechain";
import { TestPie } from "../typechain/TestPie";
import TimeTraveler from "../utils/TimeTraveler";

describe("Oven", function () {
  this.timeout("30s");

  let pool: TestPie;
  let recipe: TestPieRecipe;
  let owner: Signer;
  let user1 : Signer;
  let user2 : Signer;
  let user3 : Signer;
  let user1Address: string;
  let user2Address: string;
  let user3Address: string;
  let users: string[];
  
  let ownerAddress: string;
  let oven: Oven;
  let timeTraveler: TimeTraveler;

  before(async function () {
    [owner, user1, user2, user3] = (await ethers.getSigners());
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();
    user3Address = await user3.getAddress();
    users = [user1Address, user2Address, user3Address]; 
    ownerAddress = await owner.getAddress();
    timeTraveler = new TimeTraveler(network.provider);
    const TestPieRecipe = await ethers.getContractFactory(
      "TestPieRecipe"
    );
    recipe = await TestPieRecipe.deploy() as TestPieRecipe;
    await recipe.deployed();

    const TestPie = await ethers.getContractFactory(
      "TestPie"
    );
    pool = await TestPie.deploy(parseEther("10000000000"), recipe.address) as TestPie;
    await pool.deployed();

    const Oven: OvenFactory = await ethers.getContractFactory("Oven") as OvenFactory;
    oven = await Oven.deploy(ownerAddress, ownerAddress, ownerAddress, pool.address, recipe.address) as Oven;

    await oven.setCap(parseEther("1000"));
    
    await timeTraveler.snapshot();
  });

  beforeEach(async() => {
    await timeTraveler.revertSnapshot();
  })

  describe("Oven happy flow", function () {
    it("Should deploy oven", async function () {
      // await oven.deployed();

      expect(await oven.getCap()).to.be.eq(parseEther("1000"));
      await oven.setCap(parseEther("100"))
      expect(await oven.getCap()).to.be.eq(parseEther("100"));
    });
    it("Deposit", async function () {
      await expect(await oven.ethBalanceOf(ownerAddress)).to.be.eq(0);
      await oven.setCap(parseEther("2"));
      await owner.sendTransaction({
        to: oven.address,
        value: parseEther("1.0")
      });
      await oven.deposit({ value: parseEther("1") });

      await expect(await oven.ethBalanceOf(ownerAddress)).to.be.eq(parseEther("2"));
    });
    it("Withdraw ETH", async function () {
      await oven.deposit({value: parseEther("2")});
      await oven.withdrawETH(parseEther("1"), ownerAddress)
      await expect(await oven.ethBalanceOf(ownerAddress)).to.be.eq(parseEther("1"));

    });
    it("Starts exchanging", async function () {
      await oven.deposit({value: parseEther("1")});
      await recipe.testSetCalcToPieAmount(parseEther("1"))

      await expect(await oven.ethBalanceOf(ownerAddress)).to.be.eq(parseEther("1"));
      await expect(await oven.outputBalanceOf(ownerAddress)).to.be.eq(parseEther("0"));

      await oven.bake([ownerAddress], parseEther("1"), parseEther("2"));

      await expect(await oven.ethBalanceOf(ownerAddress)).to.be.eq(parseEther("0"));
      await expect(await oven.outputBalanceOf(ownerAddress)).to.be.eq(parseEther("1"));
    });
    it("Withdraw Output", async function () {
      await oven.deposit({ value: parseEther("1")});
      await recipe.testSetCalcToPieAmount(parseEther("1"));
      await oven.bake([ownerAddress], parseEther("1"), parseEther("10000"));

      await expect(await oven.outputBalanceOf(ownerAddress)).to.be.eq(parseEther("1"));
      await expect(await pool.balanceOf(ownerAddress)).to.be.eq(parseEther("0"))
      await oven.withdrawOutput(ownerAddress)
      await expect(await oven.outputBalanceOf(ownerAddress)).to.be.eq(parseEther("0"));
      await expect(await pool.balanceOf(ownerAddress)).to.be.eq(parseEther("1"))
    });
  });

  describe("Test Deployment flow", function () {
    it("Regular deployment", async function () {
      await recipe.testSetCalcToPieAmount(1);
      await oven.setCap(parseEther("1000"));

      expect(await oven.pie()).to.be.eq(pool.address)
      await owner.sendTransaction({
        to: oven.address,
        value:parseEther("1.0")
      });
      await oven.bake([ownerAddress], 1, 1)
      await oven.deposit({ value: parseEther("1") });
      await oven.withdrawAll(ownerAddress)
      await oven.withdrawAllETH(ownerAddress)
      await oven.withdrawETH(parseEther("0"), ownerAddress)
      await oven.withdrawOutput(ownerAddress)
    })
    it("Set pie failing", async function () {
      await expect(oven.setPie(pool.address)).to.be.revertedWith("PIE_ALREADY_SET")
    })
    describe("No initial pool deployment", function () {
      it("Deploy pool with zero pool addres", async function () {
        const Oven: OvenFactory = await ethers.getContractFactory("Oven") as OvenFactory;
        const oven = await Oven.deploy(ownerAddress, ownerAddress, ownerAddress, constants.AddressZero, constants.AddressZero) as Oven;
        await oven.deployed();
        await oven.setCap(parseEther("1000"));

        await expect(await oven.pie()).to.be.eq(constants.AddressZero)
        await expect(oven.bake([], 1, 1)).to.be.revertedWith("PIE_NOT_SET")
        await expect(owner.sendTransaction({
          to: oven.address,
          value:parseEther("1.0")
        })).to.be.revertedWith("PIE_NOT_SET")
        await expect(oven.deposit({ value: parseEther("1") })).to.be.revertedWith("PIE_NOT_SET")
        await expect(oven.withdrawAll(ownerAddress)).to.be.revertedWith("PIE_NOT_SET")
        await expect(oven.withdrawAllETH(ownerAddress)).to.be.revertedWith("PIE_NOT_SET")
        await expect(oven.withdrawETH(parseEther("0"), ownerAddress)).to.be.revertedWith("PIE_NOT_SET")
        await expect(oven.withdrawOutput(ownerAddress)).to.be.revertedWith("PIE_NOT_SET")
      })
      it("Deploy pool with zero recipe addres", async function () {
        const Oven = await ethers.getContractFactory("Oven") as OvenFactory;
        const oven = await Oven.deploy(ownerAddress, ownerAddress, ownerAddress, pool.address, constants.AddressZero) as Oven;
        await oven.deployed();
        await oven.setCap(parseEther("1000"));

        await expect(await oven.pie()).to.be.eq(pool.address)
        await expect(oven.bake([], 1, 1)).to.be.revertedWith("RECIPE_NOT_SET")
        await expect(owner.sendTransaction({
          to: oven.address,
          value:parseEther("1.0")
        })).to.be.revertedWith("RECIPE_NOT_SET")
        await expect(oven.deposit({ value: parseEther("1") })).to.be.revertedWith("RECIPE_NOT_SET")
        await expect(oven.withdrawAll(ownerAddress)).to.be.revertedWith("RECIPE_NOT_SET")
        await expect(oven.withdrawAllETH(ownerAddress)).to.be.revertedWith("RECIPE_NOT_SET")
        await expect(oven.withdrawETH(parseEther("0"), ownerAddress)).to.be.revertedWith("RECIPE_NOT_SET")
        await expect(oven.withdrawOutput(ownerAddress)).to.be.revertedWith("RECIPE_NOT_SET")
      })
      it("Deploy pool with zero addresses", async function () {
        const Oven = await ethers.getContractFactory("Oven");
        const oven = await Oven.deploy(ownerAddress, ownerAddress, ownerAddress, constants.AddressZero, constants.AddressZero) as Oven;
        await oven.deployed();
        await oven.setCap(parseEther("1000"));
        await expect(oven.withdrawOutput(ownerAddress)).to.be.revertedWith("PIE_NOT_SET")
      })
      it("Set pie and recipe", async function () {
        const Oven = await ethers.getContractFactory("Oven");
        const oven = await Oven.deploy(ownerAddress, ownerAddress, ownerAddress, constants.AddressZero, constants.AddressZero) as Oven;
        await oven.setPie(pool.address);
        await oven.setRecipe(recipe.address);
        await expect(await oven.pie()).to.be.eq(pool.address);
        await expect(await oven.recipe()).to.be.eq(recipe.address);
        await recipe.testSetCalcToPieAmount(1);
        await oven.setCap(constants.MaxUint256);
        await owner.sendTransaction({
          to: oven.address,
          value: 1
        });
        await oven.bake([ownerAddress], 1, 1)
        await owner.sendTransaction({
          to: oven.address,
          value:parseEther("1.0")
        });
        await oven.deposit({ value: parseEther("1") });
        await oven.withdrawAll(ownerAddress)
        await oven.withdrawAllETH(ownerAddress)
        await oven.withdrawETH(parseEther("0"), ownerAddress)
        await oven.withdrawOutput(ownerAddress)
      })
      it("Set pie failing", async function () {
        await expect(oven.setPie(pool.address)).to.be.revertedWith("PIE_ALREADY_SET")
      })
      it("Set recipe failing", async function () {
        await expect(oven.setRecipe(pool.address)).to.be.revertedWith("RECIPE_ALREADY_SET")
      })
      it("Set pie + recipe failing", async function () {
        await expect(oven.setPieAndRecipe(pool.address, recipe.address)).to.be.revertedWith("PIE_ALREADY_SET")
      })
      it("Set pie and recipe, in one tx", async function () {
        const Oven = await ethers.getContractFactory("Oven");
        const localOven = await Oven.deploy(ownerAddress, ownerAddress, ownerAddress, constants.AddressZero, constants.AddressZero) as Oven;
        await localOven.setPieAndRecipe(pool.address, recipe.address)
        await expect(await localOven.pie()).to.be.eq(pool.address)
        await expect(await localOven.recipe()).to.be.eq(recipe.address)
      })
      it("verify controller functions", async function () {
        // TODO double check these
        await expect(oven.connect(user1).setPieAndRecipe(constants.AddressZero, constants.AddressZero)).to.be.revertedWith("AUTH_FAILED");
        await expect(oven.connect(user1).setPie(constants.AddressZero)).to.be.revertedWith("AUTH_FAILED");
        await expect(oven.connect(user1).setRecipe(constants.AddressZero)).to.be.revertedWith("AUTH_FAILED");
        await expect(oven.connect(user1).setCap(constants.AddressZero)).to.be.revertedWith("AUTH_FAILED");
      })
  })
  })

  describe("Test baking", function () {
    beforeEach(async function () {
      await oven.setCap(parseEther("1000"));
      await oven.connect(user1).deposit({ value: parseEther("100") });
      await oven.connect(user2).deposit({ value: parseEther("100") });
      await oven.connect(user3).deposit({ value: parseEther("100") });
    });

    it("Non controller", async function () {
        await expect (
          oven.connect(user1).bake([ownerAddress], parseEther("1"), parseEther("2"))
        ).to.be.revertedWith("AUTH_FAILED")
    })
    it("Price too much", async function () {
      await recipe.testSetCalcToPieAmount(parseEther("50"))
      await expect (
        oven.bake([ownerAddress], parseEther("1"), parseEther("25"))
      ).to.be.revertedWith("PRICE_ERROR")
    })
    it("Total insufficient funds", async function () {
      // price needed
      await recipe.testSetCalcToPieAmount(parseEther("310"))

      await expect (
        oven.bake(
          [await user1.getAddress(), await user2.getAddress(), await user3.getAddress()],
          parseEther("10"),
          parseEther("350")
        )
      ).to.be.revertedWith("INSUFFICIENT_FUNDS")
    })
    it("Success (exact)", async function () {
      // price needed
      await recipe.testSetCalcToPieAmount(parseEther("300"))
      const users = [user1Address, user2Address, user3Address];
      for(const user of users) {
        await expect(await oven.ethBalanceOf(await user)).to.be.eq(parseEther("100"));
        await expect(await oven.outputBalanceOf(await user)).to.be.eq(parseEther("0"));
      }

      await oven.bake(
        users,
        parseEther("30"),
        parseEther("300")
      )

      for(const user of users) {
        await expect(await oven.ethBalanceOf(user)).to.be.eq(parseEther("0"));
        await expect(await oven.outputBalanceOf(user)).to.be.eq(parseEther("10"));
      };

    })
    it("Success (too much)", async function () {
      // price needed
      await recipe.testSetCalcToPieAmount(parseEther("250"))
      for(const user of users) {
        await expect(await oven.ethBalanceOf(user)).to.be.eq(parseEther("100"));
        await expect(await oven.outputBalanceOf(user)).to.be.eq(parseEther("0"));
      };

      await oven.bake(
        users,
        parseEther("30"),
        parseEther("300")
      )

      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("0"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("12"));

      await expect(await oven.ethBalanceOf(user2Address)).to.be.eq(parseEther("0"));
      await expect(await oven.outputBalanceOf(user2Address)).to.be.eq(parseEther("12"));

      await expect(await oven.ethBalanceOf(user3Address)).to.be.eq(parseEther("50"));
      await expect(await oven.outputBalanceOf(user3Address)).to.be.eq(parseEther("6"));
    })

  })

  describe("Test deposit/withdraw eth + cap", function () {
    beforeEach(async function () {
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

      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("400"))
      await expect(await oven.ethBalanceOf(user2Address)).to.be.eq(parseEther("400"))
      await expect(await oven.ethBalanceOf(user3Address)).to.be.eq(parseEther("0"))
    })
    it("Deposit", async function () {
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("0"))
      await oven.connect(user1).deposit({ value: parseEther("100") })
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("100"))
      await oven.connect(user1).deposit({ value: parseEther("100") })
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("200"))
    })
    it("Deposit ether transfer", async function () {
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("0"))
      await user1.sendTransaction({
        to: oven.address,
        value:parseEther("100")
      });
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("100"))
      await user1.sendTransaction({
        to: oven.address,
        value:parseEther("100")
      });
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("200"))
    })
    it("Deposit and withdraw", async function () {

      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("0"))
      await oven.connect(user1).deposit({ value: parseEther("100") })
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("100"))

      await oven.connect(user1).withdrawETH(parseEther("10"), user2Address);
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("90"))

      // TODO validate user2 eth balance
    })
  });

  describe("Test withdraw output", function () {
    beforeEach(async function () {
      await oven.setCap(parseEther("1000"));
      await oven.connect(user1).deposit({ value: parseEther("100") })

      await recipe.testSetCalcToPieAmount(parseEther("90"))
      await oven.bake(
        [user1Address],
        parseEther("100"),
        parseEther("100")
      )
    });
    it("Withdraw", async function () {
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("10"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("100"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("0"));

      await oven.connect(user1).withdrawOutput(user1Address)

      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("10"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("0"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("100"));
    })
    it("Withdraw couple times", async function () {
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("10"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("100"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("0"));

      await oven.connect(user1).withdrawOutput(user1Address)

      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("10"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("0"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("100"));

      await oven.connect(user1).withdrawOutput(user1Address)

      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("10"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("0"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("100"));

    })
    it("Withdraw to other ussr", async function () {
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("10"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("100"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("0"));

      await expect(await oven.ethBalanceOf(user2Address)).to.be.eq(parseEther("0"));
      await expect(await oven.outputBalanceOf(user2Address)).to.be.eq(parseEther("0"));
      await expect(await pool.balanceOf(user2Address)).to.be.eq(parseEther("0"));

      await oven.connect(user1).withdrawOutput(user2Address)

      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("10"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("0"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("0"));

      await expect(await oven.ethBalanceOf(user2Address)).to.be.eq(parseEther("0"));
      await expect(await oven.outputBalanceOf(user2Address)).to.be.eq(parseEther("0"));
      await expect(await pool.balanceOf(user2Address)).to.be.eq(parseEther("100"));
    })
    it("Withdraw all", async function () {
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("10"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("100"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("0"));

      await oven.connect(user1).withdrawAll(user1Address)

      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("0"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("0"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("100"));
    })
    it("Withdraw all ETH", async function () {
      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("10"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("100"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("0"));

      await oven.connect(user1).withdrawAllETH(user1Address)

      await expect(await oven.ethBalanceOf(user1Address)).to.be.eq(parseEther("0"));
      await expect(await oven.outputBalanceOf(user1Address)).to.be.eq(parseEther("100"));
      await expect(await pool.balanceOf(user1Address)).to.be.eq(parseEther("0"));
    })
  });

  describe("Test controller functions", function () {
    it("Bake restriction", async function () {
      await expect (
        oven.connect(user1).bake([ownerAddress], parseEther("1"), parseEther("2"))
      ).to.be.revertedWith("AUTH_FAILED")
    })
    it("Cap restriction", async function () {
      await expect (
        oven.connect(user1).setCap(parseEther("1"))
      ).to.be.revertedWith("AUTH_FAILED")
    })
    it("Assign role restriction", async function () {
      const user1Addr = await user1Address;
      await expect (
        oven.connect(user1).grantRole(await oven.CONTROLLER_ROLE(), await ownerAddress)
      ).to.be.revertedWith("AccessControl: sender must be an admin to grant")
    })
  });
});