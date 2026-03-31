async function main() {
  const vaultAddress = "0x4B5100BD739Cf027Eaeb40139B5CfDA2536Ccd19";

  const DiceGame = await ethers.getContractFactory("DiceGame");

  console.log("Deploying DiceGame...");

  const dice = await DiceGame.deploy(vaultAddress);

  await dice.waitForDeployment();

  console.log("✅ DiceGame deployed to:", await dice.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});