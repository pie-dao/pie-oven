# Oven

Put your ETH in the oven to bake a pie.


## How to run

```
yarn
yarn compile
yarn test
```

## Bake call

This call will generate the calldata needed to bake

Get some help:

`npx hardhat --network mainnet bake --help`

Example call:

```
npx hardhat --network goerli bake \
--min-deposit 100000000000000000 \
--min-address 1 \
--max-address 6 \
--slippage 3 \
--oven 0x26fC22e1A99d4FFb5e0C6Ad33a7b9319958910E6 \
--start-block 3604155
```
## Deploy oven

Create .env file

```
INFURA_API_KEY=
MAINNET_PRIVATE_KEY=
GOERLI_PRIVATE_KEY=
ETHERSCAN_API=
```

### Using factory
**Deploy factory**

npx hardhat run --network {goerli/mainnet} scripts/deployOvenFactory.ts

or

HARDHAT_NETWORK=mainnet ts-node ./scripts/deployOvenFactory.ts

**Deploy emty oven**

NOTE: change variables at top of script

> npx hardhat run --network {goerli/mainnet} scripts/deployEmptyOvenUsingFactory.ts

**Deploy filled oven**

NOTE: change variables at top of script

> npx hardhat run --network {goerli/mainnet} scripts/deployOvenUsingFactory.ts


