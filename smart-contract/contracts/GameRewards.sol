// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CoinFlipCommitReveal is Ownable(msg.sender), ReentrancyGuard {

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
    mapping(address => uint256[]) public playerBets;

    uint256 public betCounter;

    event BetPlaced(uint256 betId, address player, uint amount, bool guess);
    event BetRevealed(uint256 betId, bool win, uint payout);
    event BetRefunded(uint256 betId, address player, uint amount);

    // 🔐 STEP 1: COMMIT
    function placeBet(bool guess, bytes32 commitHash) external payable nonReentrant {
        require(msg.value >= minBet && msg.value <= maxBet, "Invalid bet");

        uint potentialPayout = (msg.value * payoutMultiplier) / 100;
        require(address(this).balance >= potentialPayout, "Insufficient liquidity");

        uint256 betId = betCounter++;

        bets[betId] = Bet({
            player: msg.sender,
            amount: msg.value,
            guess: guess,
            commitHash: commitHash,
            timestamp: block.timestamp,
            revealed: false
        });

        playerBets[msg.sender].push(betId);

        emit BetPlaced(betId, msg.sender, msg.value, guess);
    }

    // 🎯 STEP 2: REVEAL
    function reveal(uint256 betId, string memory secret) external nonReentrant {
        Bet storage bet = bets[betId];

        require(msg.sender == bet.player, "Not your bet");
        require(!bet.revealed, "Already revealed");

        // Verify commit
        require(
            keccak256(abi.encodePacked(secret)) == bet.commitHash,
            "Invalid secret"
        );

        // Generate randomness
        uint random = uint(
            keccak256(
                abi.encodePacked(
                    secret,
                    blockhash(block.number - 1),
                    address(this)
                )
            )
        ) % 2;

        bool result = (random == 0);

        uint payout = 0;
        bool win = false;

        if (result == bet.guess) {
            payout = (bet.amount * payoutMultiplier) / 100;

            if (address(this).balance >= payout) {
                (bool success, ) = bet.player.call{value: payout}("");
                require(success, "Transfer failed");
                win = true;
            }
        }

        bet.revealed = true;

        emit BetRevealed(betId, win, payout);
    }

    // 🧯 REFUND if user doesn't reveal
    function claimTimeout(uint256 betId) external nonReentrant {
        Bet storage bet = bets[betId];

        require(!bet.revealed, "Already resolved");
        require(
            block.timestamp >= bet.timestamp + revealTimeout,
            "Wait more"
        );

        require(msg.sender == bet.player, "Not your bet");

        uint amount = bet.amount;
        bet.revealed = true;

        (bool success, ) = bet.player.call{value: amount}("");
        require(success, "Refund failed");

        emit BetRefunded(betId, msg.sender, amount);
    }

    // 📊 View
    function getPlayerBets(address player) external view returns (uint256[] memory) {
        return playerBets[player];
    }

    // ⚙️ Admin
    function setPayoutMultiplier(uint _m) external onlyOwner {
        require(_m >= 110 && _m <= 300);
        payoutMultiplier = _m;
    }

    function withdraw(uint amount) external onlyOwner {
        require(address(this).balance >= amount, "Not enough");
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}