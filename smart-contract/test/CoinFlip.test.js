const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoinFlip", function () {
  let contract, player, attacker;

  beforeEach(async () => {
    [_, player, attacker] = await ethers.getSigners();

    const CF = await ethers.getContractFactory("CoinFlipCommitReveal");
    contract = await CF.deploy();

    // ✅ FIX 1
    await contract.waitForDeployment();

    // ✅ FIX 2
    const contractAddress = await contract.getAddress();

    await ethers.provider.send("hardhat_setBalance", [
      contractAddress,
      "0x1000000000000000000",
    ]);
  });

  it("should fail if bet exceeds maxBet", async () => {
    const secret = "abc";

    // ✅ FIX 3 (ethers v6)
    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(secret)
    );

    await expect(
      contract.connect(player).placeBet(true, hash, {
        // ✅ FIX 4
        value: ethers.parseEther("2"),
      })
    ).to.be.revertedWith("Invalid bet");
  });

  it("should not allow other user to reveal", async () => {
    const secret = "abc";

    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(secret)
    );

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"),
    });

    await expect(
      contract.connect(attacker).reveal(0, secret)
    ).to.be.revertedWith("Not your bet");
  });

  it("should not allow reveal twice", async () => {
    const secret = "abc";

    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(secret)
    );

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"),
    });

    await contract.connect(player).reveal(0, secret);

    await expect(
      contract.connect(player).reveal(0, secret)
    ).to.be.revertedWith("Already revealed");
  });

  it("should not allow timeout claim twice", async () => {
    const secret = "abc";

    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(secret)
    );

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"),
    });

    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    await contract.connect(player).claimTimeout(0);

    await expect(
      contract.connect(player).claimTimeout(0)
    ).to.be.revertedWith("Already resolved");
  });

  it("should handle rapid bets", async () => {
    const secret = "abc";

    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(secret)
    );

    for (let i = 0; i < 5; i++) {
      await contract.connect(player).placeBet(true, hash, {
        value: ethers.parseEther("0.1"),
      });
    }
  });

  it("should fail with wrong hash reveal", async () => {
  const secret = "abc";
  const hash = ethers.keccak256(ethers.toUtf8Bytes(secret));

  await contract.connect(player).placeBet(true, hash, {
    value: ethers.parseEther("0.1"),
  });

  await expect(
    contract.connect(player).reveal(0, "wrong")
  ).to.be.reverted;
});
});