// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Vault is Ownable {

    mapping(address => bool) public authorizedGames;

    event GameAuthorized(address game);
    event GameRemoved(address game);

    constructor() Ownable(msg.sender) {}

    function authorizeGame(address game) external onlyOwner {
        authorizedGames[game] = true;
    }

    function removeGame(address game) external onlyOwner {
        authorizedGames[game] = false;
    }

    // ✅ NEW: explicit deposit
    function deposit() external payable {}

    function payout(address player, uint amount) external {
        require(authorizedGames[msg.sender], "Not authorized");
        require(address(this).balance >= amount, "Insufficient funds");

        (bool success, ) = player.call{value: amount}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}

    function withdraw(uint amount) external onlyOwner {
        require(address(this).balance >= amount, "Not enough");

        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdraw failed");
    }
}