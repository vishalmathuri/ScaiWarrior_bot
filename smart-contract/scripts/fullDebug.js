const { ethers } = require("hardhat");

async function main() {
  const coinFlipAddress = "0xac127f9d343E8512579d35221e4Ba7430a67b329";
  const expectedVault = "0xBe110e293C4d6a1703B99d76f9EB4E559aDEBa98";

  const coinFlip = await ethers.getContractAt("CoinFlip", coinFlipAddress);
  const vaultAddress = await coinFlip.vault();

  console.log("CoinFlip uses Vault:", vaultAddress);
  console.log("Expected Vault:", expectedVault);

  const balance = await ethers.provider.getBalance(vaultAddress);
  console.log("Vault Balance:", ethers.formatEther(balance), "ETH");

  const vault = await ethers.getContractAt("Vault", vaultAddress);
  const isAuth = await vault.authorizedGames(coinFlipAddress);

  console.log("Is Authorized:", isAuth);
}

main().catch(console.error);