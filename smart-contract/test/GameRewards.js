const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CoinFlipCommitReveal", function () {
  let contract, owner, player;

  beforeEach(async function () {
    [owner, player] = await ethers.getSigners();

    const CoinFlip = await ethers.getContractFactory("CoinFlipCommitReveal");
    contract = await CoinFlip.deploy();
    await contract.waitForDeployment(); // ✅ FIX

    const contractAddress = await contract.getAddress(); // ✅ FIX

    await owner.sendTransaction({
      to: contractAddress,
      value: ethers.parseEther("20"), // ✅ FIX
    });
  });

  function generateCommit(secret) {
    return ethers.keccak256( // ✅ FIX
      ethers.toUtf8Bytes(secret) // ✅ FIX
    );
  }

  it("Should allow user to place bet", async function () {
    const hash = generateCommit("test");

    const tx = await contract.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"), // ✅ FIX
    });

    expect(tx.hash).to.exist;
  });

  it("Should reject bet below minimum", async function () {
    const hash = generateCommit("test");

    await expect(
      contract.connect(player).placeBet(true, hash, {
        value: ethers.parseEther("0.001"),
      })
    ).to.be.revertedWith("Invalid bet"); // ✅ FIX
  });

  it("Should resolve bet", async function () {
    const secret = "secret";
    const hash = generateCommit(secret);

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"),
    });

    const tx = await contract.connect(player).reveal(0, secret);
    expect(tx.hash).to.exist;
  });

  it("Should fail wrong secret", async function () {
    const secret = "correct";
    const hash = generateCommit(secret);

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"),
    });

    await expect(
      contract.connect(player).reveal(0, "wrong")
    ).to.be.revertedWith("Invalid secret"); // ✅ FIX
  });

  it("Should not allow double reveal", async function () {
    const secret = "abc";
    const hash = generateCommit(secret);

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"),
    });

    await contract.connect(player).reveal(0, secret);

    await expect(
      contract.connect(player).reveal(0, secret)
    ).to.be.revertedWith("Already revealed"); // ✅ FIX
  });

  it("Should allow refund after timeout", async function () {
    const hash = generateCommit("timeout");

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"),
    });

    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    const tx = await contract.connect(player).claimTimeout(0);
    expect(tx.hash).to.exist;
  });

  it("Should not allow early refund", async function () {
    const hash = generateCommit("early");

    await contract.connect(player).placeBet(true, hash, {
      value: ethers.parseEther("0.1"),
    });

    await expect(
      contract.connect(player).claimTimeout(0)
    ).to.be.revertedWith("Wait more"); // ✅ FIX
  });
});