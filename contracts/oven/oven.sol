// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IUniswapExchange.sol";

contract Oven {
    // Sponsoring can be done transferring tokens to this pool before the start of a round.
    using SafeMath for uint256;

    enum States {PREPARE, BAKE, MUNCH}

    event Deposit(address accountAddress, uint256 amount);
    // account => stake
    mapping(address => uint256) private stake;
    // *totalValue variables are set during state = PREPARE
    // Final total value of a baking session
    uint256 private finalTotalValue;
    // Current total value in the pool
    uint256 private totalValue;

    // *tokensclaimable variables are set during state = BAKE
    // Final amount of tokens during a baking session
    uint256 private finalTotalTokensClaimable;
    // Current amout tokens left to claim in the pool
    uint256 private totalTokensClaimable;
    States private state;

    address private controller;
    IUniswapExchange private pool;

    constructor(address _controller, address _pool) public {
        controller = _controller;
        pool = IUniswapExchange(_pool);
    }

    modifier onlyController {
        require(msg.sender == controller, "NOT_CONTROLLER");
        _;
    }

    function setStatePrepare() public onlyController {
        require(state == States.MUNCH, "WRONG_STATE");
        require(totalTokensClaimable == 0, "STILL_CLAIMABLE_LEFT");

        state = States.PREPARE;
        finalTotalValue = 0;
        totalValue = 0;
        finalTotalTokensClaimable = 0;
        totalTokensClaimable = 0;
    }

    function setStateBake() public onlyController {
        require(state == States.PREPARE, "WRONG_STATE");
        finalTotalValue = totalValue;
        state = States.BAKE;
    }

    function setStateMunch() public onlyController {
        require(state == States.BAKE, "WRONG_STATE");
        require(totalValue == 0, "STILL_ETH_LEFT");
        finalTotalTokensClaimable = totalTokensClaimable;
        state = States.MUNCH;
    }

    function execute(
        uint256 _ethToSell,
        uint256 _tokenToBuy,
        uint256 _deadline
    ) public onlyController {
        require(state == States.BAKE, "WRONG_STATE");
        require(totalValue > 0, "POOL_EMPTY");
        require(totalValue >= _ethToSell, "NOT_ENOUGH_ETH");
        require(_tokenToBuy > 0, "ZERO_VALUE");
        uint256 ethSold = pool.ethToTokenTransferOutput{value: _ethToSell}(
            _tokenToBuy,
            _deadline,
            msg.sender
        );
        totalTokensClaimable = pool.balanceOf(address(this));
        totalValue = totalValue.sub(ethSold);
    }

    function deposit() public payable {
        // maybe do minimum amount. as a people can deposit 1 wei of eth to bully.
        // this requires a claim call for every deposit. Gas costs will be high.
        // Because the balance needs to be 0 for the pool to continue.
        // OR create setStatePrepareForce, which will do something cool with the left over tokens.
        require(state == States.PREPARE, "WRONG_STATE");
        stake[msg.sender] = stake[msg.sender].add(msg.value);
        totalValue = totalValue.add(msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    receive() external payable {
        this.deposit();
    }

    function claim(address _staker) external {
        require(state == States.MUNCH, "WRONG_STATE");
        require(stake[_staker] > 0, "NO_BALANCE");
        uint256 toClaim = stake[_staker].mul(finalTotalTokensClaimable).div(
            finalTotalValue
        );
        totalTokensClaimable = totalTokensClaimable.sub(toClaim);
        stake[_staker] = 0;
        // TODO do sanity checks on the toClaim amount;
        pool.transfer(_staker, toClaim);
    }

    function getState() external view returns (States) {
        return state;
    }

    function getStake(address _address) external view returns (uint256) {
        return stake[_address];
    }

    function getTotalValue() external view returns (uint256) {
        return totalValue;
    }

    function getFinalTotalValue() external view returns (uint256) {
        return finalTotalValue;
    }

    function getTotalTokensClaimable() external view returns (uint256) {
        return totalTokensClaimable;
    }

    function getFinalTotalTokensClaimable() external view returns (uint256) {
        return finalTotalTokensClaimable;
    }
}
