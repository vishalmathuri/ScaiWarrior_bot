const hre = require("hardhat");

async function main() {

  console.log("Deploying contract...");

  const GameRewards = await hre.ethers.getContractFactory("GameRewards");

  const contract = await GameRewards.deploy();

  await contract.deployed();   // <-- correct for ethers v5

  console.log("Contract deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});