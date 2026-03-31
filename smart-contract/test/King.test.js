const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KingGame", function () {
  let vault, king, owner, player;

  beforeEach(async () => {
    [owner, player] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment(); // ✅ FIX

    const vaultAddress = await vault.getAddress(); // ✅ FIX

    const King = await ethers.getContractFactory("KingGame");
    king = await King.deploy(vaultAddress);
    await king.waitForDeployment(); // ✅ FIX

    const kingAddress = await king.getAddress(); // ✅ FIX

    await vault.authorizeGame(kingAddress);

    await owner.sendTransaction({
      to: vaultAddress,
      value: ethers.parseEther("10"), // ✅ FIX
    });
  });

  it("should play game", async () => {
    await king.connect(player).play(1, {
      value: ethers.parseEther("0.1"), // ✅ FIX
    });
  });

  it("should fail if zero bet", async () => {
    await expect(
      king.connect(player).play(1, { value: 0 })
    ).to.be.revertedWith("Invalid bet"); // ✅ BETTER WAY
  });

  it("should allow multiple players", async () => {
    const [, p1, p2] = await ethers.getSigners();

    await king.connect(p1).play(1, {
      value: ethers.parseEther("0.1"),
    });

    await king.connect(p2).play(0, {
      value: ethers.parseEther("0.1"),
    });
  });

  it("should fail if bet too high", async () => {
  await expect(
    king.connect(player).play(1, {
      value: ethers.parseEther("100"),
    })
  ).to.be.reverted;
});
});