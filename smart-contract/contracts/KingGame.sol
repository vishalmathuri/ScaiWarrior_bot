// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVault {
    function payout(address player, uint amount) external;
    function deposit() external payable;
}

contract KingGame is ReentrancyGuard {

    IVault public vault;

    constructor(address _vault) {
        vault = IVault(_vault);
    }

    event Played(address player, uint bet, uint kingIndex, uint guess, bool win);

    function play(uint guessIndex) external payable nonReentrant {
        require(msg.value > 0, "Invalid bet");
        require(guessIndex < 3, "Invalid index");

        vault.deposit{value: msg.value}();

        uint random = uint(
            keccak256(
                abi.encodePacked(msg.sender, block.timestamp)
            )
        );

        uint kingIndex = random % 3;
        bool win = (guessIndex == kingIndex);

        if (win) {
            vault.payout(msg.sender, msg.value * 2);
        }

        emit Played(msg.sender, msg.value, kingIndex, guessIndex, win);
    }
}