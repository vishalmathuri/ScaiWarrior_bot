const { ethers } = require("hardhat");

async function main() {
  const vaultAddress = "0x5fc629d6091d57e0a8Af3785c242f2b89F9e9E13";
  const coinflipAddress = "0x70B2791DdB8c0f622dD3d30c2aB85C877F056152";

  const vault = await ethers.getContractAt("Vault", vaultAddress);

  const isAllowed = await vault.allowedGames(coinflipAddress);
  console.log("CoinFlip authorized:", isAllowed);
}

main();