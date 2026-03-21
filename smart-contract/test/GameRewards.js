const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoinFlipCommitReveal", function () {
  let contract, owner, player;

  beforeEach(async function () {
    [owner, player] = await ethers.getSigners();

    const CoinFlip = await ethers.getContractFactory("CoinFlipCommitReveal");
    contract = await CoinFlip.deploy();
    await contract.deployed();

    await owner.sendTransaction({
      to: contract.address,
      value: ethers.utils.parseEther("20"),
    });
  });

  function generateCommit(secret) {
    return ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(secret)
    );
  }

  it("Should allow user to place bet", async function () {
    const hash = generateCommit("test");

    const tx = await contract.connect(player).placeBet(true, hash, {
      value: ethers.utils.parseEther("0.1"),
    });

    expect(tx.hash).to.exist; // basic check
  });

  it("Should reject bet below minimum", async function () {
    const hash = generateCommit("test");

    try {
      await contract.connect(player).placeBet(true, hash, {
        value: ethers.utils.parseEther("0.001"),
      });
      expect.fail("Transaction should fail");
    } catch (err) {
      expect(err.message).to.include("Invalid bet");
    }
  });

  it("Should resolve bet", async function () {
    const secret = "secret";
    const hash = generateCommit(secret);

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.utils.parseEther("0.1"),
    });

    const tx = await contract.connect(player).reveal(0, secret);

    expect(tx.hash).to.exist;
  });

  it("Should fail wrong secret", async function () {
    const secret = "correct";
    const hash = generateCommit(secret);

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.utils.parseEther("0.1"),
    });

    try {
      await contract.connect(player).reveal(0, "wrong");
      expect.fail("Should fail");
    } catch (err) {
      expect(err.message).to.include("Invalid secret");
    }
  });

  it("Should not allow double reveal", async function () {
    const secret = "abc";
    const hash = generateCommit(secret);

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.utils.parseEther("0.1"),
    });

    await contract.connect(player).reveal(0, secret);

    try {
      await contract.connect(player).reveal(0, secret);
      expect.fail("Should fail");
    } catch (err) {
      expect(err.message).to.include("Already revealed");
    }
  });

  it("Should allow refund after timeout", async function () {
    const hash = generateCommit("timeout");

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.utils.parseEther("0.1"),
    });

    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    const tx = await contract.connect(player).claimTimeout(0);
    expect(tx.hash).to.exist;
  });

  it("Should not allow early refund", async function () {
    const hash = generateCommit("early");

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.utils.parseEther("0.1"),
    });

    try {
      await contract.connect(player).claimTimeout(0);
      expect.fail("Should fail");
    } catch (err) {
      expect(err.message).to.include("Wait more");
    }
  });
});