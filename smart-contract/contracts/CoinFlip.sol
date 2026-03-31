// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IVault {
    function payout(address player, uint amount) external;
    function deposit() external payable;
}

contract CoinFlip is Ownable, ReentrancyGuard {

    IVault public vault;

    uint public minBet = 0.05 ether;
    uint public maxBet = 1 ether;
    uint public payoutMultiplier = 180;
    uint public revealTimeout = 10 minutes;

    struct Bet {
        address player;
        uint amount;
        bool guess;
        bytes32 commitHash;
        uint timestamp;
        bool revealed;
    }

    mapping(uint256 => Bet) public bets;
    uint256 public betCounter;

    event BetPlaced(uint256 betId, address player, uint amount, bool guess);
    event BetRevealed(uint256 betId, bool win, uint payout);
    event BetRefunded(uint256 betId, address player, uint amount);

    constructor(address _vault) Ownable(msg.sender) {
        vault = IVault(_vault);
    }

    function placeBet(bool guess, bytes32 commitHash) external payable nonReentrant {
        require(msg.value >= minBet && msg.value <= maxBet, "Invalid bet");

        // ✅ SEND TO VAULT
        vault.deposit{value: msg.value}();

        bets[betCounter] = Bet(
            msg.sender,
            msg.value,
            guess,
            commitHash,
            block.timestamp,
            false
        );

        emit BetPlaced(betCounter, msg.sender, msg.value, guess);
        betCounter++;
    }

    function reveal(uint256 betId, string memory secret) external nonReentrant {
        Bet storage bet = bets[betId];

        require(msg.sender == bet.player, "Not your bet");
        require(!bet.revealed, "Already revealed");

        require(
            keccak256(abi.encodePacked(secret)) == bet.commitHash,
            "Invalid secret"
        );

        uint random = uint(
            keccak256(
                abi.encodePacked(secret, blockhash(block.number - 1))
            )
        ) % 2;

        bool win = (random == (bet.guess ? 1 : 0));
        uint payout = 0;

        if (win) {
            payout = (bet.amount * payoutMultiplier) / 100;
            vault.payout(bet.player, payout);
        }

        bet.revealed = true;

        emit BetRevealed(betId, win, payout);
    }

    function claimTimeout(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];

        require(msg.sender == bet.player, "Not your bet");
        require(!bet.revealed, "Already resolved");
        require(block.timestamp >= bet.timestamp + revealTimeout, "Wait more");

        bet.revealed = true;

        // ✅ REFUND FROM VAULT
        vault.payout(bet.player, bet.amount);

        emit BetRefunded(betId, msg.sender, bet.amount);
    }

    function setVault(address _vault) external onlyOwner {
        vault = IVault(_vault);
    }
}