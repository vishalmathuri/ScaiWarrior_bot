const { ethers } = require("hardhat");

async function main() {
  // 🔥 PUT YOUR VAULT ADDRESS HERE
  const VAULT_ADDRESS = "0x4B5100BD739Cf027Eaeb40139B5CfDA2536Ccd19";

  console.log("Deploying WheelGame...");

  const WheelGame = await ethers.getContractFactory("WheelGame");
  const wheel = await WheelGame.deploy(VAULT_ADDRESS);

  await wheel.waitForDeployment();

  const address = await wheel.getAddress();

  console.log("✅ WheelGame deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});