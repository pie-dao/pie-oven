import {ethers} from "hardhat";

async function mainnet2() {
    // const Recipe = await ethers.getContractFactory("InterestingRecipe");
    // const recipe = await Recipe.deploy();
    // await recipe.deployed();
    const recipe = await ethers.getContractAt("InterestingRecipe", process.env.RECIPE as string)
    // console.log("Recipe deployed to:", process.env.RECIPE);

    const AAVE_IDENTIFIER = await ethers.utils.keccak256(ethers.utils.toUtf8Bytes("aave.protocol"))
    const COMPOUND_IDENTIFIER = await ethers.utils.keccak256(ethers.utils.toUtf8Bytes("compound.protocol"))

    const AAVE_LP_ADDRESS_PROVIDER = "0x24a42fD28C976A61Df5D00D0599C34c4f90748c8"
    const COMPTROLLER = "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b"

    const tokens = [
        {
            //YFI
            underlying: "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
            compound: undefined,
            aave: "0x12e51E77DAAA58aA0E9247db7510Ea4B46F9bEAd",
            cream: "0xCbaE0A83f4f9926997c8339545fb8eE32eDc6b76"
        },
        {
            //KP3R
            underlying: "0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44",
            compound: undefined,
            aave: undefined,
            cream: "0x903560b1CcE601794C584F58898dA8a8b789Fc5d"
        },
        {
            //COVER
            underlying: "0x5d8d9f5b96f4438195be9b99eee6118ed4304286",
            compound: undefined,
            aave: undefined,
            cream: undefined,
        },
        {
            //SUSHI
            underlying: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
            compound: undefined,
            aave: undefined,
            cream: "0x338286C0BC081891A4Bda39C7667ae150bf5D206"
        },
        {
            //CREAM
            underlying: "0x2ba592f78db6436527729929aaf6c908497cb200",
            compound: undefined,
            aave: undefined,
            cream: "0x892B14321a4FCba80669aE30Bd0cd99a7ECF6aC0"
        },
        {
            //PICKLE
            underlying: "0x429881672b9ae42b8eba0e26cd9c73711b891ca5",
            compound: undefined,
            aave: undefined,
            cream: undefined
        },
        {
            //AKRO
            underlying: "0x8ab7404063ec4dbcfd4598215992dc3f8ec853d7",
            compound: undefined,
            aave: undefined,
            cream: undefined
        },
        {
            //AAVE
            underlying: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
            compound: undefined,
            aave: "0xba3D9687Cf50fE253cd2e1cFeEdE1d6787344Ed5",
            cream: "0x3225E3C669B39C7c8B3e204a8614bB218c5e31BC"
        },
        {
            //LINK
            underlying: "0x514910771af9ca656af840dff83e8264ecf986ca",
            compound: undefined,
            aave: "0xA64BD6C70Cb9051F6A9ba1F163Fdc07E0DfB5F84",
            cream: "0x697256CAA3cCaFD62BB6d3Aa1C7C5671786A5fD9" 
        },
        {
            //SNX
            underlying: "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
            compound: undefined,
            aave: "0x328C4c80BC7aCa0834Db37e6600A6c49E12Da4DE",
            cream: undefined
        },
        {
            //UNI
            underlying: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
            compound: "0x35A18000230DA775CAc24873d00Ff85BccdeD550",
            aave: "0xB124541127A0A657f056D9Dd06188c4F1b0e5aab",
            cream: "0xe89a6D0509faF730BD707bf868d9A2A744a363C7"
        },
        {
            //MKR
            underlying: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
            compound: undefined,
            aave: "0x7deB5e830be29F91E298ba5FF1356BB7f8146998",
            cream: undefined
        },
        {
            //COMPOUND
            underlying: "0xc00e94cb662c3520282e6f5717214004a7f26888",
            compound: "0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4",
            aave: undefined,
            cream: "0x19D1666f543D42ef17F66E376944A22aEa1a8E46"
        }
    ]

    const wrappedTokens: string[] = [];
    const underlyingTokens: string [] = [];
    const protocols: string [] = [];

    for(const token of tokens) {
        if(token.compound != undefined) {
            wrappedTokens.push(token.compound);
            underlyingTokens.push(token.underlying);
            protocols.push(COMPTROLLER);
        }
        if(token.aave != undefined) {
            wrappedTokens.push(token.aave);
            underlyingTokens.push(token.underlying);
            protocols.push(AAVE_LP_ADDRESS_PROVIDER);
        }
        if(token.cream != undefined) {
            wrappedTokens.push(token.cream),
            underlyingTokens.push(token.underlying);
            protocols.push(COMPTROLLER);
        }
    }


    console.log(underlyingTokens);
    console.log(wrappedTokens);
    console.log(protocols);

    console.log("Updating aave identifier")
    let tx = await recipe.updateProtocolIdentifier(AAVE_LP_ADDRESS_PROVIDER, AAVE_IDENTIFIER)

    console.log("Updating compound identifier")
    tx = await recipe.updateProtocolIdentifier(COMPTROLLER, COMPOUND_IDENTIFIER)

    console.log("Updating mapping")
    tx = await recipe.updateMapping(
        wrappedTokens,
        underlyingTokens,
        protocols,
        {gasLimit: 6000000}
    )

    // const tx2 = await recipe.toPie("0x992e9f1D29E2FdB57A9E09A78e122fAFE3720CC5", ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") });

    console.log(tx);
    // console.log(tx2);

}
mainnet2()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
