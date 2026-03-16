const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const app = express();

app.use(cors());
app.use(express.json());

// Local Hardhat blockchain
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Private key from Hardhat node (Account #0)
const privateKey = "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0";

const wallet = new ethers.Wallet(privateKey, provider);

// Deployed contract address
const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Contract ABI
const abi = [
  "function submitScore(uint256 _score) public",
  "function scores(address) view returns (uint256)"
];

// Connect to contract
const contract = new ethers.Contract(contractAddress, abi, wallet);


// Submit score endpoint
app.post("/submit-score", async (req, res) => {

  try {

    const { score } = req.body;

    console.log("Received score:", score);

    const tx = await contract.submitScore(score);

    console.log("Transaction sent:", tx.hash);

    await tx.wait();

    console.log("Transaction confirmed");

    res.json({
      success: true,
      txHash: tx.hash
    });

  } catch (error) {

    console.error("Transaction failed:", error);

    res.status(500).json({
      success: false,
      error: "Transaction failed"
    });

  }

});


// Get score endpoint
app.get("/score/:address", async (req, res) => {

  try {

    const playerAddress = req.params.address;

    const score = await contract.scores(playerAddress);

    res.json({
      address: playerAddress,
      score: score.toString()
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to fetch score"
    });

  }

});


// Start server
app.listen(3000, () => {

  console.log("Backend running on port 3000");

});