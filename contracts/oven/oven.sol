// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/PieRecipe.sol";

contract Oven {
    // Sponsoring can be done transferring tokens to this pool before the start of a round.
    using SafeMath for uint256;

    event Deposit(address accountAddress, uint256 amount);

    mapping(address => uint256) public ethBalanceOf;
    mapping(address => uint256) public outputBalanceOf;
    address public controller;
    IERC20 public pie;
    PieRecipe public recipe;
    uint256 public cap;

    constructor(
        address _controller,
        address _pie,
        address _recipe
    ) public {
        controller = _controller;
        pie = IERC20(_pie);
        recipe = PieRecipe(_recipe);
    }

    function bake(
        address[] calldata _receivers,
        uint256[] calldata _amounts,
        uint256 _outputAmount,
        uint256 _maxPrice
    ) public {
        require(msg.sender == controller, "NOT_CONTROLLER");
        require(_receivers.length == _amounts.length, "UNEQUAL_LENGTH");

        uint256 realPrice = recipe.calcToPie(address(pie), _outputAmount);
        require(realPrice <= _maxPrice, "PRICE_ERROR");

        uint256 totalInputAmount = 0;
        for (uint256 i = 0; i < _receivers.length; i++) {
            // This logic aims to execute the following logic
            // E.g. 5 eth is needed to mint the outputAmount
            // User 1: 2 eth (100% used)
            // User 2: 2 eth (100% used)
            // User 3: 2 eth (50% used)
            // User 4: 2 eth (0% used)

            uint256 userAmount = _amounts[i];
            if (totalInputAmount == realPrice) {
                break;
            } else if (totalInputAmount.add(userAmount) <= realPrice) {
                totalInputAmount = totalInputAmount.add(userAmount);
            } else {
                totalInputAmount = realPrice;
                userAmount = realPrice.sub(totalInputAmount);
            }

            ethBalanceOf[_receivers[i]] = ethBalanceOf[_receivers[i]].sub(
                userAmount
            );

            outputBalanceOf[_receivers[i]] = outputBalanceOf[_receivers[i]].add(
                _outputAmount.mul(userAmount).div(realPrice)
            );
        }
        // Sanity check, if this occurs the contract is broken.
        require(totalInputAmount == realPrice, "FATAL_CONTRACT_ERR");
        // For more sanity checks, verify there is no excess eth send by toPie
        recipe.toPie{value: realPrice}(address(pie), _outputAmount);
    }

    function deposit() public payable {
        ethBalanceOf[msg.sender] = ethBalanceOf[msg.sender].add(msg.value);
        require(address(this).balance <= cap, "MAX_CAP");
        emit Deposit(msg.sender, msg.value);
    }

    receive() external payable {
        deposit();
    }

    function withdrawETH(uint256 _amount, address payable _receiver) public {
        ethBalanceOf[msg.sender] = ethBalanceOf[msg.sender].sub(_amount);
        _receiver.transfer(_amount);
    }

    function withdrawOutput(uint256 _amount, address _receiver) external {
        outputBalanceOf[msg.sender] = outputBalanceOf[msg.sender].sub(_amount);
        pie.transfer(_receiver, _amount);
    }

    function setCap(uint256 _cap) external {
        require(msg.sender == controller, "NOT_CONTROLLER");
        cap = _cap;
    }

    function setController(address _controller) external {
        require(msg.sender == controller, "NOT_CONTROLLER");
        controller = _controller;
    }

    function getCap() external view returns (uint256) {
        return cap;
    }
}
