const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DiceGame", function () {
  let vault, dice, owner, player;

  beforeEach(async () => {
    [owner, player] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy();
    await vault.waitForDeployment(); // ✅ FIX

    const Dice = await ethers.getContractFactory("DiceGame");

    // ✅ FIX: get vault address properly
    const vaultAddress = await vault.getAddress();

    dice = await Dice.deploy(vaultAddress);
    await dice.waitForDeployment(); // ✅ FIX

    // ✅ FIX: get dice address
    const diceAddress = await dice.getAddress();

    await vault.authorizeGame(diceAddress);

    // ✅ FIX: send ETH using v6 syntax
    await owner.sendTransaction({
      to: vaultAddress,
      value: ethers.parseEther("10"),
    });
  });

  it("should play dice", async () => {
    await dice.connect(player).play(0, {
      value: ethers.parseEther("0.1"), // ✅ FIX
    });
  });

  it("should handle multiple plays", async () => {
    for (let i = 0; i < 5; i++) {
      await dice.connect(player).play(0, {
        value: ethers.parseEther("0.1"), // ✅ FIX
      });
    }
  });

  it("should fail if bet is zero", async () => {
  await expect(
    dice.connect(player).play(0, { value: 0 })
  ).to.be.revertedWith("Invalid bet");
});
});