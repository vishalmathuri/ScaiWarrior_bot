
const { ethers } = require("hardhat");

async function main() {
  const vaultAddress = "0x4B5100BD739Cf027Eaeb40139B5CfDA2536Ccd19";

  const games = [
    "0x89487b9C251fb15F14D48775A01BAC806de9cD41", // Dice
    "0xEDe3bCA3551A12D022Fd3aC8F50c4CA564903B10", // King
    "0x4DA410dbaBaeD3933092Fac6B13c45d56a457Af4", // Wheel
    "0x3f8A24d3142526dCD4A8F5B01b5565F7Cc50AB2C"  // CoinFlip
  ];

  const vault = await ethers.getContractAt("Vault", vaultAddress);

  for (const game of games) {
    const tx = await vault.authorizeGame(game); // ✅ correct function
    await tx.wait();
    console.log(`✅ Authorized: ${game}`);
  }

  console.log("\n🎉 All games authorized successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});