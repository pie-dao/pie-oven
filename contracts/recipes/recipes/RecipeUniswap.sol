pragma solidity 0.6.4;

// import "@openzeppelin/contracts/access/Ownable.sol"
import "./LibSafeApprove.sol";
import "../interfaces/IWETH.sol";
import "../interfaces/IUniswapV2Router02.sol";
import "../interfaces/ISmartPoolRegistry.sol";
import "../interfaces/IPSmartPool.sol";
import {UniswapV2Library as UniLib} from "./UniswapV2Library.sol";

import "hardhat/console.sol";


contract Recipe /*is Ownable */{
    ISmartPoolRegistry public constant registry = ISmartPoolRegistry(
        0x412a5d5eC35fF185D6BfF32a367a985e1FB7c296
    );
    IWETH public constant WETH = IWETH(
        0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    );
    IUniswapV2Router02 public constant uniRouter = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);


    function swapGivenOutput(
        address _inputToken,
        address _outputToken,
        uint256 _outputAmount,
        uint256 _maxInput,
        address _receiver
    ) external returns(uint256) {
        uint256 inputAmount = _calcInputFromOutput(_inputToken, _outputToken, _outputAmount);
        require(IERC20(_inputToken).transferFrom(msg.sender, address(this), inputAmount), "Transfer failed");
        return _swapGivenOutput(_inputToken, _outputToken, _outputAmount, _maxInput, _receiver);
    }

    function _swapGivenOutput(
        address _inputToken,
        address _outputToken,
        uint256 _outputAmount,
        uint256 _maxInput,
        address _receiver
    ) internal returns(uint256) {
        // TODO might wanna fix redundant calcs
        uint256 inputAmount = _calcInputFromOutput(_inputToken, _outputToken, _outputAmount);
        require(_maxInput >= inputAmount, "Input too low");

        IERC20 inputToken = IERC20(_inputToken);

        // If input is not WETH. Swap to WETH first
        if(_inputToken != address(WETH)) {
            swapGivenInput(_inputToken, address(WETH), inputAmount, 0, address(this));
        }


        if(registry.inRegistry(_outputToken)) {
            (address[] memory tokens, uint256[] memory amounts) = IPSmartPool(_inputToken).calcTokensForAmount(_outputAmount);

            for(uint256 i = 0; i < tokens.length; i ++) {
                _swapGivenOutput(address(WETH), tokens[i], amounts[i], uint256(-1), address(0));
                //Approve pie to pull token
                LibSafeApprove.safeApprove(IERC20(tokens[i]), _outputToken, amounts[i]);
            }

            //Mint Pie
            IPSmartPool(_outputToken).joinPool(_outputAmount);

        } else {
            // If needs to be swapped to normal token
            LibSafeApprove.safeApprove(inputToken, address(uniRouter), inputAmount);
            uniRouter.swapTokensForExactTokens(_outputAmount, _maxInput, makeRoute(address(WETH), _outputToken), address(this), uint256(-1));
        }

        //if called recursively don't send output to another address
        if(_receiver != address(0)) {
            // Send output token to msg.sender
            IERC20(_outputToken).transfer(_receiver, _outputAmount);

            // Send input token remainder
            uint256 remainingInputTokenAmount = inputToken.balanceOf(address(this));

            if(remainingInputTokenAmount != 0) {
                inputToken.transfer(_receiver, remainingInputTokenAmount);
            }
        }

        return inputAmount;
    }

    function swapGivenOutputFromEth(
        address _outputToken,
        uint256 _outputAmount
    ) external payable {
        uint256 ethAmount = _calcInputFromOutput(address(WETH), _outputToken, _outputAmount);
        require(ethAmount <= msg.value, "msg.value too low");
        WETH.deposit{value: msg.value}();
        _swapGivenOutput(address(WETH), _outputToken, _outputAmount, ethAmount, msg.sender);
    }

    function swapGivenInput(
        address _inputToken,
        address _outputToken,
        uint256 _inputAmount,
        uint256 _minOutput,
        address _receiver
    ) public returns(uint256) {
        require(IERC20(_inputToken).transferFrom(msg.sender, address(this), _inputAmount), "Transfer failed");
        return _swapGivenInput(_inputToken, _outputToken, _inputAmount, _minOutput, _receiver);
    }

    function _swapGivenInput(
        address _inputToken,
        address _outputToken,
        uint256 _inputAmount,
        uint256 _minOutput,
        address _receiver
    ) internal returns(uint256) {
        uint256 outputAmount = _calcOutputFromInput(_inputToken, _outputToken, _inputAmount);
        require(outputAmount >= _minOutput, "Output too low");

        IERC20 inputToken = IERC20(_inputToken);

        if(registry.inRegistry(_inputToken)) {
            //if pie redeem and sell each underlying
            IPSmartPool pie = IPSmartPool(_inputToken);
            pie.exitPool(_inputAmount);
            
            // TODO try catch for supporting new calcTokensForAmountExit
            (address[] memory tokens, uint256[] memory amounts) = pie.calcTokensForAmount(_inputAmount);

            for(uint256 i = 0; i < tokens.length; i ++) {
                _swapGivenInput(tokens[i], address(WETH), amounts[i], 0, address(0));
            }

        } else if(_inputToken != address(WETH)) {
            // TODO check if we are already holding weth as input
            // If needs to be swapped to normal token
            console.log("swapping to weth");
            LibSafeApprove.safeApprove(inputToken, address(uniRouter), _inputAmount);
            uniRouter.swapExactTokensForTokens(_inputAmount, 0, makeRoute(_inputToken, address(WETH)), address(this), uint256(-1))[0];

            uint256 WethBalance = WETH.balanceOf(address(this));

            return _swapGivenInput(address(WETH), _outputToken, WethBalance, 0, _receiver);
        } else {
            LibSafeApprove.safeApprove(WETH, address(uniRouter), _inputAmount);
            uniRouter.swapExactTokensForTokens(_inputAmount, 0, makeRoute(address(WETH), _outputToken), address(this), uint256(-1));
        }
        
        uint256 WethBalance = WETH.balanceOf(address(this));

        //if called recursively don't send output to another address
        if(_receiver != address(0)) {
            // Send output token to msg.sender
            IERC20(_outputToken).transfer(_receiver, outputAmount);

            // Send input token remainder
            uint256 remainingInputTokenAmount = inputToken.balanceOf(address(this));

            if(remainingInputTokenAmount != 0) {
                inputToken.transfer(_receiver, remainingInputTokenAmount);
            }
        }

        return outputAmount;
    }

    function swapGivenInputToETH(
        address _inputToken,
        uint256 _inputAmount,
        uint256 _minOutput,
        address _receiver
    ) external returns(uint256) {
        require(IERC20(_inputToken).transferFrom(msg.sender, address(this), _inputAmount), "Transfer failed");
        return _swapGivenInput(_inputToken, address(WETH), _inputAmount, _minOutput, address(this));
        WETH.withdraw(WETH.balanceOf(address(this)));
        uint256 ethBalance = address(this).balance;
        payable(_receiver).transfer(ethBalance);
    }

    function _calcInputFromOutput(
        address _inputToken,
        address _outputToken,
        uint256 _outputAmount
    ) internal returns(uint256) {
        return calcInputFromOutput(_inputToken, _outputToken, _outputAmount);
    }

    function _calcOutputFromInput(
        address _inputToken,
        address _outputToken,
        uint256 _inputAmount
    ) internal returns(uint256) {
        return calcOutputFromInput(_inputToken, _outputToken, _inputAmount);
    }
    
    function calcInputFromOutput(
        address _inputToken,
        address _outputToken,
        uint256 _outputAmount
    ) public view returns(uint256) {

        uint256 ethAmount = 0;
        console.log("Registry address: ", address(registry));
        // If output is pie, buy all of the underlyings
        if(registry.inRegistry(_outputToken)) {
            IPSmartPool pie = IPSmartPool(_outputToken);
            (address[] memory tokens, uint256[] memory amounts) = pie.calcTokensForAmount(_outputAmount);

            for(uint256 i = 0; i < tokens.length; i++) {
                ethAmount += calcInputFromOutput(tokens[i], address(WETH), amounts[i]);
            }

        } else {
            (uint256 reserveA, uint256 reserveB) = UniLib.getReserves(
                    address(uniRouter.factory()),
                    address(WETH),
                    _outputToken
                );
            ethAmount = UniLib.getAmountIn(_outputAmount, reserveA, reserveB);
        }

        if(_inputToken != address(WETH)) {
            return calcInputFromOutput(_inputToken, address(WETH), ethAmount);
        } else {
            return ethAmount;
        }
    }

    function calcOutputFromInput(
        address _inputToken,
        address _outputToken,
        uint256 _inputAmount
    ) public view returns(uint256) {

        console.log("calcOutputFromInput");
        console.log(_inputToken, _outputToken, _inputAmount);

        uint256 ethAmount;

        if(registry.inRegistry(_inputToken)) {
            IPSmartPool pie = IPSmartPool(_outputToken);
            // TODO calcExit
            (address[] memory tokens, uint256[] memory amounts) = pie.calcTokensForAmount(_inputAmount);

            for(uint256 i = 0; i < tokens.length; i++) {
                ethAmount += calcOutputFromInput(tokens[i], address(WETH), amounts[i]);
            }
        } else if(_inputToken != address(WETH)) {
            //  function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut)
            (uint256 reserveA, uint256 reserveB) = UniLib.getReserves(
                    address(uniRouter.factory()),
                    _inputToken,
                    address(WETH)
            );

            ethAmount = UniLib.getAmountOut(_inputAmount, reserveA, reserveB);

            return calcOutputFromInput(address(WETH), _outputToken, ethAmount);
        }
        else {
            (uint256 reserveA, uint256 reserveB) = UniLib.getReserves(
                    address(uniRouter.factory()),
                    address(WETH),
                    _outputToken
            );

            return UniLib.getAmountOut(_inputAmount, reserveA, reserveB);
        }
    }

    // janky code to create non fixed size memory array
    function makeRoute(address _input, address _output) internal pure returns (address[] memory) {
        address[] memory value = new address[](2);
        value[0] = _input;
        value[1] = _output;
        return value; 
    }
}