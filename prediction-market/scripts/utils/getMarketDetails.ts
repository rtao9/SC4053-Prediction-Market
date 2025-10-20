import { network } from "hardhat";
import { getDeployedAddress } from "./getDeployedAddress.js";

const { ethers } = await network.connect();

// Get deployed contract address from Ignition
const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {
  moduleName: "PredictionMarketModule",
});

async function main() {
  const [deployer] = await ethers.getSigners();
  const predictionMarket = await ethers.getContractAt(
    "PredictionMarket",
    CONTRACT_ADDRESS
  );

  // You can change this to any valid market ID
  const marketId = 1;

  console.log(`Fetching details for Market ID: ${marketId} ...`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);

  try {
    const details = await predictionMarket.getMarketDetails(marketId);

    // Destructure results for readability
    const [
      creator,
      description,
      status,
      outcome,
      totalYesBets,
      totalNoBets,
      resolutionTime,
      currentTime,
    ] = details;

    // 🕒 Convert resolution time to human-readable date
    const date = new Date(Number(resolutionTime) * 1000).toLocaleString();

    console.log("Market Details:");
    console.log("----------------------------");
    console.log(`Market ID: ${marketId}`);
    console.log(`Creator: ${creator}`);
    console.log(`Description: ${description}`);
    console.log(`Status: ${status} (0=Open, 1=Closed, 2=Resolved)`);
    console.log(`Outcome: ${outcome} (0=Undecided, 1=Yes, 2=No)`);
    console.log(`Total Yes Bets: ${ethers.formatEther(totalYesBets)} ETH`);
    console.log(`Total No Bets: ${ethers.formatEther(totalNoBets)} ETH`);
    console.log(`Resolution Time: ${resolutionTime} (${date})`);
    console.log(`Current Time: ${currentTime} (${date})`);

    console.log("----------------------------");
  } catch (err) {
    console.error("Error fetching market details:", err);
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exitCode = 1;
});
