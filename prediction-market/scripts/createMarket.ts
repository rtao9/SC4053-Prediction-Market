import { network } from "hardhat";
import { getDeployedAddress } from "./utils/getDeployedAddress";

const { ethers } = await network.connect();

// Get the deployed contract address from Ignition
const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {
  moduleName: "PredictionMarketModule",
});

async function main() {
  const [deployer] = await ethers.getSigners();
  const predictionMarket = await ethers.getContractAt(
    "PredictionMarket",
    CONTRACT_ADDRESS
  );

  // Use the blockchain's current timestamp instead of Date.now()
  const latestBlock = await ethers.provider.getBlock("latest");
  const currentTime = Number(latestBlock.timestamp);

  await ethers.provider.send("evm_setNextBlockTimestamp", [currentTime + 1]);
  await ethers.provider.send("evm_mine", []);
  const resolutionTime = currentTime + 120;

  const description = "Will BTC reach $100,000 by 2026?";

  console.log(`Creating market on contract: ${CONTRACT_ADDRESS}`);
  console.log(`Current block time: ${currentTime}`);
  console.log(`Resolution time set to: ${resolutionTime}`);

  const tx = await predictionMarket
    .connect(deployer)
    .createMarket(description, resolutionTime);

  await tx.wait();

  console.log(`Market created successfully by ${deployer.address}`);
}

main().catch((error) => {
  console.error("Error creating market:", error);
  process.exitCode = 1;
});
