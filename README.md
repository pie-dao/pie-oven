# Oven

Put your ETH in the oven to bake a pie.


## How to run

```
yarn
yarn compile
yarn test
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

**Deploy emty oven**

NOTE: change variables at top of script

> npx hardhat run --network {goerli/mainnet} scripts/deployEmptyOvenUsingFactory.ts

**Deploy filled oven**

NOTE: change variables at top of script

> npx hardhat run --network {goerli/mainnet} scripts/deployOvenUsingFactory.ts


