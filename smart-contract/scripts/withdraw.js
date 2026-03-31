const { ethers } = require("hardhat");

async function main() {
  const vaultAddress = "0x4DA1c5d8501dCf12C52911bf44FDD29BbFe6685C";

  const amount = ethers.parseEther("2"); // 👈 change amount

  const vault = await ethers.getContractAt("Vault", vaultAddress);

  const tx = await vault.withdraw(amount);
  await tx.wait();

  console.log(`✅ Withdrawn ${ethers.formatEther(amount)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});