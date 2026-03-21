async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const CoinFlip = await ethers.getContractFactory("CoinFlipCommitReveal");
  const contract = await CoinFlip.deploy();

  await contract.deployed();

  console.log("Contract deployed at:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});