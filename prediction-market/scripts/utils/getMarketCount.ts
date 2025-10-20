import { network } from "hardhat";
import { getDeployedAddress } from "./getDeployedAddress.js";

const { ethers } = await network.connect();

const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {
  moduleName: "PredictionMarketModule",
});

async function main() {
  // Get signer and contract instance
  const [deployer] = await ethers.getSigners();
  const predictionMarket = await ethers.getContractAt(
    "PredictionMarket",
    CONTRACT_ADDRESS
  );

  // Fetch current market count
  const marketCount = await predictionMarket.getMarketCount();

  console.log("ontract address:", CONTRACT_ADDRESS);
  console.log("Queried by:", deployer.address);
  console.log("Total markets created:", marketCount.toString());
}

main().catch((error) => {
  console.error("Error fetching market count:", error);
  process.exitCode = 1;
});
