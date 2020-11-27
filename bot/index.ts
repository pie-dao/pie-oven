import { bake } from '../scripts/bake';
const hre = require("hardhat");
const utils = hre.ethers.utils;

const ethers = hre.ethers;
// const gasNow = require('./apis/gasnow');  
// const discord = require('./apis/discord');

const provider = ethers.getDefaultProvider('mainnet', {
    infura: process.env.INFURA_KEY,
});


async function run() {
    console.log('Running');

    let gasPrices = {rapid: 95000000000}; //await gasNow.fetchGasPrice();

    console.log('Rapid Gas is:', gasPrices.rapid);
    await bake('0x1d616dad84dd0b3ce83e5fe518e90617c7ae3915', 11340069);
    //let hash = await pool.pokeWeights({gasLimit: '100000000000', gasPrice: gasPrices.rapid});
    //await discord.notify(`Poking weights of ${pieName} at ${Date.now()}, next pokeing in ${process.env.INTERVAL} seconds.`)
}

setInterval(function(){ run()}, process.env.INTERVAL || 60000)
run();