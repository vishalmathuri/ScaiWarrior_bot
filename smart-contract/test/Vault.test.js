const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault", function () {
  let vault, owner, player, game;

  beforeEach(async () => {
    [owner, player, game] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment(); // ✅ FIX

    const vaultAddress = await vault.getAddress(); // ✅ FIX

    await owner.sendTransaction({
      to: vaultAddress,
      value: ethers.parseEther("10"), // ✅ FIX
    });
  });

  it("should authorize game", async () => {
    const gameAddress = await game.getAddress();

    await vault.authorizeGame(gameAddress);

    expect(await vault.authorizedGames(gameAddress)).to.equal(true);
  });

  it("should NOT allow non-owner to authorize", async () => {
    const playerAddress = await player.getAddress();

    await expect(
      vault.connect(player).authorizeGame(playerAddress)
    ).to.be.reverted; // ✅ FIX (no manual try/catch)
  });

  it("should remove authorized game", async () => {
    const gameAddress = await game.getAddress();

    await vault.authorizeGame(gameAddress);
    await vault.removeGame(gameAddress);

    expect(await vault.authorizedGames(gameAddress)).to.equal(false);
  });

  it("should fail payout if insufficient balance", async () => {
    const gameAddress = await game.getAddress();
    const playerAddress = await player.getAddress();

    await vault.authorizeGame(gameAddress);

    await expect(
      vault
        .connect(game)
        .payout(playerAddress, ethers.parseEther("1000"))
    ).to.be.revertedWith("Insufficient funds"); // ✅ FIX
  });

  it("should NOT allow non-owner withdraw", async () => {
    await expect(
      vault.connect(player).withdraw(1)
    ).to.be.reverted; // ✅ FIX
  });

  it("should allow owner to withdraw", async () => {
  const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

  await vault.withdraw(ethers.parseEther("1"));

  const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

  expect(ownerBalanceAfter).to.be.gt(ownerBalanceBefore);
});

it("should allow payout to player", async () => {
  const gameAddress = await game.getAddress();
  const playerAddress = await player.getAddress();

  await vault.authorizeGame(gameAddress);

  await vault.connect(game).payout(playerAddress, ethers.parseEther("1"));

  const balance = await ethers.provider.getBalance(playerAddress);
  expect(balance).to.be.gt(0);
});

it("should not allow unauthorized game payout", async () => {
  const playerAddress = await player.getAddress();

  await expect(
    vault.connect(game).payout(playerAddress, ethers.parseEther("1"))
  ).to.be.reverted;
});
});