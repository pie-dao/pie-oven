// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../interfaces/IUniswapExchange.sol";

contract TestUniswapExchange {
    using SafeMath for uint256;
    mapping(address => uint256) private balance;

    function ethToTokenTransferOutput(
        uint256 tokens_bought,
        uint256 deadline,
        address recipient
    ) public payable returns (uint256 eth_sold) {
        balance[msg.sender] = balance[msg.sender].add(tokens_bought);
        return msg.value;
    }

    function transfer(address _to, uint256 _value) public returns (bool) {
        balance[msg.sender] = balance[msg.sender].sub(_value);
        balance[_to] = balance[_to].add(_value);
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256) {
        return balance[_owner];
    }
}
