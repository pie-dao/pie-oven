// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

interface IUniswapExchange {
    function ethToTokenTransferOutput(
        uint256 tokens_bought,
        uint256 deadline,
        address recipient
    ) external payable returns (uint256 eth_sold);

    function transfer(address _to, uint256 _value) external returns (bool);

    function balanceOf(address _owner) external view returns (uint256);
}
