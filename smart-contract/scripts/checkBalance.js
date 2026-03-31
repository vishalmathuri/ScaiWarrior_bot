const { ethers } = require("hardhat");

async function main() {
  const vaultAddress = "0x4B5100BD739Cf027Eaeb40139B5CfDA2536Ccd19";

  const balance = await ethers.provider.getBalance(vaultAddress);

  console.log("Vault Balance:", ethers.formatEther(balance), "ETH");
}

main();