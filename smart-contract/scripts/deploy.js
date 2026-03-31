// async function main() {
//   const [deployer] = await ethers.getSigners();

//   console.log("Deploying with:", deployer.address);

//   const CoinFlip = await ethers.getContractFactory("CoinFlipCommitReveal");
//   const contract = await CoinFlip.deploy();

//   //await contract.deployed();

//   await contract.waitForDeployment();
//   console.log("Contract deployed at:", contract.address);
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

async function main() {
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("Vault:", vaultAddress);

  const Dice = await ethers.getContractFactory("DiceGame");
  const dice = await Dice.deploy(vaultAddress);
  await dice.waitForDeployment();
  console.log("Dice:", await dice.getAddress());

  const King = await ethers.getContractFactory("KingGame");
  const king = await King.deploy(vaultAddress);
  await king.waitForDeployment();
  console.log("King:", await king.getAddress());

  const Wheel = await ethers.getContractFactory("WheelGame");
  const wheel = await Wheel.deploy(vaultAddress);
  await wheel.waitForDeployment();
  console.log("Wheel:", await wheel.getAddress());

  // ✅ ADD THIS
  const CoinFlip = await ethers.getContractFactory("CoinFlip");
  const coinflip = await CoinFlip.deploy(vaultAddress);
  await coinflip.waitForDeployment();
  console.log("CoinFlip:", await coinflip.getAddress());
}

main();