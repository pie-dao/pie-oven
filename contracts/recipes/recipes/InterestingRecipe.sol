pragma solidity 0.6.4;

import "../Ownable.sol";
import "../interfaces/IAaveLendingPool.sol";
import "../interfaces/IAaveAToken.sol";
import "../interfaces/ICompoundCToken.sol";
import "../interfaces/IERC20.sol";

contract InterestingRecipe is Ownable{

    // IDEA: current token supports are hard coded.
    // Use calldata to create a more generalized protocol

    mapping(address => address) public wrappedToToken;
    mapping(address => address) public tokenToWrapped;
    mapping(address => address) public wrappedToProtocol;
    mapping(address => bytes32) public protocolIdentifier;

    address[] public tokens;
    mapping(address => bool) public tokenIsSupported;

    function updateProtocolIdentifier(
        address _protocol,
        bytes32 _identifier
    ) external onlyOwner{
        protocolIdentifier[_protocol] = _identifier;
    }

    function UpdateMapping(
        address[] calldata _wrapped,
        address[] calldata _token,
        address[] calldata _protocol
    ) external onlyOwner {
        require(_wrapped.length == _token.length, "UNEQUAL_LENGTH");
        require(_wrapped.length == _protocol.length, "UNEQUAL_LENGTH");
        for(uint256 i = 0; i < _wrapped.length; i++) {
            wrappedToToken[_wrapped[i]] = _token[i];
            tokenToWrapped[_token[i]] = _wrapped[i];
            wrappedToProtocol[_wrapped[i]] = _protocol[i];
        }
    }

    function Wrap(address _token, uint256 _amount) external {
        address wrapped = tokenToWrapped[_token];
        address protocol = wrappedToProtocol[wrapped];
        bytes32 identifier = protocolIdentifier[protocol];

        if (identifier == keccak256("aave.protocol")) {
            // todo support eth?
            IAaveLendingPool aave = IAaveLendingPool(protocol);
            // contract needs to hold amount
            aave.deposit(wrapped, _amount, 0);
        }
        else if (identifier == keccak256("compound.protocol")) {
            ICompoundCToken cToken = ICompoundCToken(wrapped);
            assert(cToken.mint(_amount) == 0);
        } else {
            revert("token not supported");
        }
    }

    function Unwrap(address _wrapped, uint256 _amount) external {
        address protocol = wrappedToProtocol[_wrapped];
        bytes32 identifier = protocolIdentifier[protocol];

        if (identifier == keccak256("aave.protocol")) {
            // todo support eth?
            IAaveAToken aToken = IAaveAToken(_wrapped);

            aToken.redeem(_amount);
        }
        else if (identifier == keccak256("compound.protocol")) {
            ICompoundCToken cToken = ICompoundCToken(_wrapped);
            assert(cToken.redeem(_amount) == 0);
        } else {
            revert("token not supported");
        }
    }
}