// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GameRewards {

 mapping(address => uint256) public scores;

 function submitScore(uint256 score) public {

  scores[msg.sender] = score;

 }

}