const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Game reward integration", function () {
  let vault, coinFlip, owner, player;

  beforeEach(async () => {
    [owner, player] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();

    const CoinFlip = await ethers.getContractFactory("CoinFlip");
    coinFlip = await CoinFlip.deploy(await vault.getAddress());
    await coinFlip.waitForDeployment();

    await vault.authorizeGame(await coinFlip.getAddress());
    await owner.sendTransaction({
      to: await vault.getAddress(),
      value: ethers.parseEther("20"),
    });
  });

  it("moves the stake into the Vault and resolves exactly once", async () => {
    const secret = "integration-secret";
    const hash = ethers.keccak256(ethers.toUtf8Bytes(secret));
    const balanceBefore = await ethers.provider.getBalance(await vault.getAddress());

    await coinFlip.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"),
    });

    expect(await ethers.provider.getBalance(await vault.getAddress())).to.equal(
      balanceBefore + ethers.parseEther("0.1")
    );

    await ethers.provider.send("evm_mine");
    await expect(coinFlip.connect(player).reveal(0, secret)).to.emit(
      coinFlip,
      "BetRevealed"
    );

    expect((await coinFlip.bets(0)).revealed).to.equal(true);
  });
});
