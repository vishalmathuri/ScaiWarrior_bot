const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WheelGame", function () {
  let vault, wheel, owner, player;

  beforeEach(async () => {
    [owner, player] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment(); // ✅ FIX

    const vaultAddress = await vault.getAddress(); // ✅ FIX

    const Wheel = await ethers.getContractFactory("WheelGame");
    wheel = await Wheel.deploy(vaultAddress);
    await wheel.waitForDeployment(); // ✅ FIX

    const wheelAddress = await wheel.getAddress(); // ✅ FIX

    await vault.authorizeGame(wheelAddress);

    await owner.sendTransaction({
      to: vaultAddress,
      value: ethers.parseEther("10"), // ✅ FIX
    });
  });

  it("should spin wheel", async () => {
    await wheel.connect(player).spin({
      value: ethers.parseEther("0.1"), // ✅ FIX
    });
  });

  it("should fail if bet too low", async () => {
    await expect(
      wheel.connect(player).spin({ value: 0 })
    ).to.be.revertedWith("Invalid bet"); // ✅ FIX
  });

  it("should allow multiple spins", async () => {
    for (let i = 0; i < 5; i++) {
      await wheel.connect(player).spin({
        value: ethers.parseEther("0.1"), // ✅ FIX
      });
    }
  });

  it("should handle many spins (stress test)", async () => {
  for (let i = 0; i < 20; i++) {
    await wheel.connect(player).spin({
      value: ethers.parseEther("0.1"),
    });
  }
});
});