import {Recipe__factory} from "../../typechain/factories/Recipe__factory";
import {IERC20__factory} from "../../typechain/factories/IERC20__factory";

import * as hre from "hardhat";
import { parseEther } from "ethers/lib/utils";
import { constants } from "ethers";


const DAI = "0x6b175474e89094c44da98b954eedeac495271d0f";
const LINK = "0x514910771af9ca656af840dff83e8264ecf986ca";

async function main(){
    //@ts-ignore
    const {ethers} = hre;

    const signers = await ethers.getSigners();
    const account = await signers[0].getAddress();
    
    const recipe = (await (new Recipe__factory(signers[0])).deploy());
    const dai = IERC20__factory.connect(DAI, signers[0]);
    const link = IERC20__factory.connect(LINK, signers[0]);

    console.log(`Recipe deployed at: ${recipe.address}`);

    const daiBalanceBefore = await dai.balanceOf(account);

    console.log("Dai balance before", daiBalanceBefore.toString());

    // buy DAI from ETH
    await recipe.swapGivenOutputFromEth(DAI, parseEther("1"), { value: parseEther("1")});
    const daiBalanceAfterSwapIn = await dai.balanceOf(account);
    console.log("Dai balance after swap", daiBalanceAfterSwapIn.toString());

    // buy LINK with DAI
    await dai.approve(recipe.address, constants.MaxUint256);
    await recipe.swapGivenInput(dai.address, link.address, parseEther("1"), 0, account);


    const daiBalance = await dai.balanceOf(account);
    const linkBalance = await link.balanceOf(account);

    console.log("Link balance after swap from dai", linkBalance.toString());
    console.log("Dai balance after swap from dai", daiBalance.toString());

    await recipe.swapGivenOutputFromEth("0xad6a626ae2b43dcb1b39430ce496d2fa0365ba9c", parseEther("1"), { value: parseEther("1")});

}
main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
