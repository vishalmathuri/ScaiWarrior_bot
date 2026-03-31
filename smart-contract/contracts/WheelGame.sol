// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVault {
    function payout(address player, uint amount) external;
    function deposit() external payable;
}

contract WheelGame is ReentrancyGuard {

    IVault public vault;

    constructor(address _vault) {
        vault = IVault(_vault);
    }

    // 🎯 Balanced + profitable multipliers
    uint[] public multipliers = [0,120,0,140,0,160,0,180];

    event SpinResult(address player, uint index, uint multiplier, uint payout);

    function spin() external payable nonReentrant {
        require(msg.value > 0, "Invalid bet");

        uint random = uint(
            keccak256(
                abi.encodePacked(msg.sender, block.timestamp)
            )
        );

        uint index = random % multipliers.length;
        uint multiplier = multipliers[index];

        uint payout = (msg.value * multiplier) / 100;

        if (multiplier == 0) {
            // ❌ full loss
            vault.deposit{value: msg.value}();
        } else {
            // ✅ player gets full payout
            vault.deposit{value: msg.value}();
            vault.payout(msg.sender, payout);
        }

        emit SpinResult(msg.sender, index, multiplier, payout);
    }
}