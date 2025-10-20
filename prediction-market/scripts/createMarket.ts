import { network } from "hardhat";

const { ethers } = await network.connect();

const CONTRACT_ADDRESS = "<DEPLOYED_CONTRACT_ADDRESS>"; // <-- Replace with actual deployed address

async function main() {
  const [deployer] = await ethers.getSigners();
  const predictionMarket = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);

  const description = "Will BTC reach $100,000 by 2026?";
  const resolutionTime = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 1 week from now

  const tx = await predictionMarket.connect(deployer).createMarket(description, resolutionTime);
  await tx.wait();

  console.log(`✅ Market created by ${deployer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
