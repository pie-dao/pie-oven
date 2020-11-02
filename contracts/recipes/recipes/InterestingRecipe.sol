pragma solidity 0.6.4;

import "../Ownable.sol";
import "./UniswapV2Recipe.sol";
import "../interfaces/IBPool.sol";

import "../interfaces/IAaveLendingPool.sol";
import "../interfaces/ICompoundCToken.sol";
import "../interfaces/IERC20.sol";

import "./SafeMath.sol";

contract InterestingRecipe is Ownable, UniswapV2Recipe {
    using SafeMath for uint;
    // IDEA: current token supports are hard coded.
    // Use calldata to create a more generalized protocol

    mapping(address => address) public wrappedToUnderlying;
    mapping(address => address) public underlyingToWrapped;

    // map to Aave lendingpool (same for every A token)
    // map to Compound C token contract (differs every C token)
    mapping(address => address) public wrappedToProtocol;
    mapping(address => bytes32) public protocolIdentifier;

    mapping(address => address) public underlyingToBPool;


    function updateProtocolIdentifier(
        address _protocol,
        bytes32 _identifier
    ) external onlyOwner{
        protocolIdentifier[_protocol] = _identifier;
    }

    function updateMapping(
        address[] calldata _wrapped,
        address[] calldata _underlying,
        address[] calldata _protocol
    ) external onlyOwner {
        require(_wrapped.length == _underlying.length, "UNEQUAL_LENGTH");
        require(_wrapped.length == _protocol.length, "UNEQUAL_LENGTH");
        for(uint256 i = 0; i < _wrapped.length; i++) {
            wrappedToUnderlying[_wrapped[i]] = _underlying[i];
            underlyingToWrapped[_underlying[i]] = _wrapped[i];
            wrappedToProtocol[_wrapped[i]] = _protocol[i];
        }
    }

    function setBPool(address _underlying, address _bPool) external onlyOwner {
        underlyingToBPool[_underlying] = _bPool;
    }


    function _swapToToken(address _wrapped, uint256 _amount, address _pie) internal override {
        address underlying = wrappedToUnderlying[_wrapped];
        address protocol  = wrappedToProtocol[_wrapped];
        bytes32 identifier = protocolIdentifier[protocol];

        // is this default for bytes32?
        if (identifier == "") {
            super._swapToToken(_wrapped, _amount, _pie);
        }
        IBPool bPool = IBPool(underlyingToBPool[underlying]);
        uint256 ethAmount = calcEthAmount(_wrapped, _amount);
        IERC20(WETH).safeApprove(address(bPool), ethAmount);

        if (identifier == keccak256("aave.protocol")) {
            // Aave is 1 to 1 exchange rate
            bPool.swapExactAmountOut(address(WETH), ethAmount, underlying, _amount, uint256(-1));
            IAaveLendingPool aave = IAaveLendingPool(protocol);
            aave.deposit(_wrapped, _amount, 0);
            IERC20(_wrapped).safeApprove(_pie, _amount);
        }
        else if (identifier == keccak256("compound.protocol")) {
            ICompoundCToken cToken = ICompoundCToken(_wrapped);
            uint256 exchangeRate = cToken.exchangeRateCurrent(); // wrapped to underlying

            // not sure if this is correct
            // https://compound.finance/docs/ctokens
            // See scripts/cTokenExchangeRate.sol
            // cToken --> Underlying asset
            uint256 underlyingAmount = _amount.mul(exchangeRate).div(10**18);
            bPool.swapExactAmountOut(address(WETH), ethAmount, underlying, underlyingAmount, uint256(-1));
            // https://compound.finance/docs/ctokens#mint
            assert(cToken.mint(underlyingAmount) == 0);

            IERC20(_wrapped).safeApprove(_pie, _amount);
        }
        revert("NOT_SUPPORTED");
    }

    // this is needed because "Solidity stack too deep", e.g. too much variables declared
    struct bPoolData {
        uint256 wethBalance;
        uint256 wethWeight;
        uint256 swapFee;
        uint256 tokenBalance;
        uint256 tokenWeight;
    }

    function calcEthAmount(address _wrapped, uint256 _buyAmount) internal override returns(uint256) {
        address underlying = wrappedToUnderlying[_wrapped];
        address protocol = wrappedToProtocol[_wrapped];
        bytes32 identifier = protocolIdentifier[protocol];

        // is this default for bytes32?
        if (identifier == "") {
            super.calcEthAmount(_wrapped, _buyAmount);
        }
        IBPool bPool = IBPool(underlyingToBPool[underlying]);
        bPoolData memory bPoolData = bPoolData({
            wethBalance: bPool.getBalance(address(WETH)),
            wethWeight:  bPool.getDenormalizedWeight(address(WETH)),
            swapFee: bPool.getSwapFee(),
            tokenBalance: bPool.getBalance(underlying),
            tokenWeight: bPool.getDenormalizedWeight(underlying)
        });

        if (identifier == keccak256("aave.protocol")) {
            // Aave: 1 to 1
            return bPool.calcInGivenOut(
                bPoolData.wethBalance,
                bPoolData.wethWeight,
                bPoolData.tokenBalance,
                bPoolData.tokenWeight,
                _buyAmount,
                bPoolData.swapFee
            );
        }
        else if (identifier == keccak256("compound.protocol")) {
            // convert _buyAmount of comp to underlying token
            // convert get price of underlying token with bpool

            ICompoundCToken cToken = ICompoundCToken(_wrapped);
            uint256 exchangeRate = cToken.exchangeRateCurrent(); // wrapped to underlying

            // not sure if this is correct
            // https://compound.finance/docs/ctokens
            // See scripts/cTokenExchangeRate.sol
            // cToken --> Underlying asset
            uint256 underlyingAmount = _buyAmount.mul(exchangeRate).div(10**18);
            return bPool.calcInGivenOut(
                bPoolData.wethBalance,
                bPoolData.wethWeight,
                bPoolData.tokenBalance,
                bPoolData.tokenWeight,
                underlyingAmount,
                bPoolData.swapFee
            );
        }
        revert("NOT_SUPPORTED");
    }
}