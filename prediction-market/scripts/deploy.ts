import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("🚀 Deploying PredictionMarket...");

  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy();

  await predictionMarket.waitForDeployment();

  const address = await predictionMarket.getAddress();
  console.log(`✅ PredictionMarket deployed at: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
