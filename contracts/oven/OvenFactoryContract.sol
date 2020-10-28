// SPDX-License-Identifier: MIT
pragma solidity ^0.7.1;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Oven.sol";

contract OvenFactoryContract is Ownable {
    event OvenCreated(
        address Oven,
        address Controller,
        address Pie,
        address Recipe
    );

    address[] public ovens;
    mapping(address => bool) public isOven;
    address public defaultController;
    address public recipe;

    function setDefaultController(address _controller) external onlyOwner {
        defaultController = _controller;
    }

    function setRecipeContract(address _recipe) external onlyOwner {
        recipe = _recipe;
    }

    function CreateEmptyOven() external {
        CreateOven(address(0));
    }

    // TODO, everyone can create an oven?
    function CreateOven(address _pie) public {
        require(defaultController != address(0), "CONTROLLER_NOT_SET");
        require(recipe != address(0), "RECIPE_NOT_SET");

        Oven oven = new Oven(address(this), _pie, recipe);
        ovens.push(address(oven));
        isOven[address(oven)] = true;

        oven.setCap(uint256(-1));
        oven.setController(defaultController);
        emit OvenCreated(address(oven), defaultController, _pie, recipe);
    }
}
