const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoinFlip", function () {
  let vault, coinFlip, owner, player, attacker;

  const commit = (secret) => ethers.keccak256(ethers.toUtf8Bytes(secret));

  async function placeBet(secret = "secret", guess = true) {
    return coinFlip.connect(player).placeBet(guess, commit(secret), {
      value: ethers.parseEther("0.1"),
    });
  }

  async function reachRevealBlock() {
    await ethers.provider.send("evm_mine");
  }

  beforeEach(async () => {
    [owner, player, attacker] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();

    const CoinFlip = await ethers.getContractFactory("CoinFlip");
    coinFlip = await CoinFlip.deploy(await vault.getAddress());
    await coinFlip.waitForDeployment();

    await vault.authorizeGame(await coinFlip.getAddress());
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("10"),
    });
  });

  it("rejects bets outside the configured limits", async () => {
    await expect(
      coinFlip.connect(player).placeBet(true, commit("low"), {
        value: ethers.parseEther("0.01"),
      })
    ).to.be.revertedWith("Invalid bet");

    await expect(
      coinFlip.connect(player).placeBet(true, commit("high"), {
        value: ethers.parseEther("2"),
      })
    ).to.be.revertedWith("Invalid bet");
  });

  it("does not allow another account to reveal", async () => {
    await placeBet("owner-secret");
    await expect(
      coinFlip.connect(attacker).reveal(0, "owner-secret")
    ).to.be.revertedWith("Not your bet");
  });

  it("waits for future-block entropy", async () => {
    await placeBet();
    await expect(coinFlip.connect(player).reveal(0, "secret")).to.be.revertedWith(
      "Reveal too early"
    );
  });

  it("resolves a committed bet once the reveal block is available", async () => {
    await placeBet();
    await reachRevealBlock();
    await expect(coinFlip.connect(player).reveal(0, "secret")).to.emit(
      coinFlip,
      "BetRevealed"
    );
  });

  it("rejects an invalid secret", async () => {
    await placeBet("correct");
    await reachRevealBlock();
    await expect(coinFlip.connect(player).reveal(0, "wrong")).to.be.revertedWith(
      "Invalid secret"
    );
  });

  it("does not allow a second reveal", async () => {
    await placeBet();
    await reachRevealBlock();
    await coinFlip.connect(player).reveal(0, "secret");
    await expect(coinFlip.connect(player).reveal(0, "secret")).to.be.revertedWith(
      "Already revealed"
    );
  });

  it("expires an unrevealed bet without giving a free refund option", async () => {
    await placeBet();
    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    await expect(coinFlip.connect(player).claimTimeout(0))
      .to.emit(coinFlip, "BetExpired")
      .withArgs(0, player.address);

    const bet = await coinFlip.bets(0);
    expect(bet.revealed).to.equal(true);
  });

  it("does not allow an expired bet to be claimed twice", async () => {
    await placeBet();
    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");
    await coinFlip.connect(player).claimTimeout(0);

    await expect(coinFlip.connect(player).claimTimeout(0)).to.be.revertedWith(
      "Already resolved"
    );
  });
});
