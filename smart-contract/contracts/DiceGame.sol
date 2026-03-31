// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVault {
    function payout(address player, uint amount) external;
    function deposit() external payable;
}

contract DiceGame is ReentrancyGuard {

    IVault public vault;

    constructor(address _vault) {
        vault = IVault(_vault);
    }

    event DicePlayed(
        address player,
        uint bet,
        uint dice1,
        uint dice2,
        uint total,
        uint choice,
        bool win
    );

    function play(uint choice) external payable nonReentrant {
        require(msg.value > 0, "Invalid bet");
        require(choice <= 2, "Invalid choice");

        vault.deposit{value: msg.value}();

        uint dice1 = (uint(
            keccak256(abi.encodePacked(msg.sender, block.timestamp))
        ) % 6) + 1;

        uint dice2 = (uint(
            keccak256(abi.encodePacked(msg.sender, block.timestamp, block.prevrandao))
        ) % 6) + 1;

        uint total = dice1 + dice2;

        bool win = false;
        uint payoutAmount = 0;

        if (choice == 0 && total < 7) {
            win = true;
            payoutAmount = msg.value * 2;
        }
        else if (choice == 2 && total > 7) {
            win = true;
            payoutAmount = msg.value * 2;
        }
        else if (choice == 1 && total == 7) {
            win = true;
            payoutAmount = msg.value * 5;
        }

        if (win) {
            vault.payout(msg.sender, payoutAmount);
        }

        emit DicePlayed(
            msg.sender,
            msg.value,
            dice1,
            dice2,
            total,
            choice,
            win
        );
    }
}