const { ethers } = require("hardhat");

async function main() {
  const coinFlipAddress = "0xac127f9d343E8512579d35221e4Ba7430a67b329";

  const coinFlip = await ethers.getContractAt("CoinFlip", coinFlipAddress);

  const vaultAddress = await coinFlip.vault();

  console.log("Connected Vault:", vaultAddress);
}

main();