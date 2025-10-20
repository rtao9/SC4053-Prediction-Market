import { network } from "hardhat";
import { getDeployedAddress } from "./utils/getDeployedAddress";

const { ethers } = await network.connect();

const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {
  moduleName: "PredictionMarketModule",
});

const marketId = 1; // change this to your actual market ID
const outcome = true; // true = Yes, false = No

async function main() {
  const [deployer, user] = await ethers.getSigners();
  const predictionMarket = await ethers.getContractAt(
    "PredictionMarket",
    CONTRACT_ADDRESS
  );

  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Attempting to resolve market as non-arbitrator:", user.address);

  try {
    const tx = await predictionMarket
      .connect(user) // Not creator, not arbitrator
      .resolveMarket(marketId, outcome);

    await tx.wait();

    console.log("Unexpected success: non-arbitrator resolved the market.");
  } catch (err: any) {
    console.error("Expected failure: transaction reverted.");
    console.error("Revert reason:", err?.error?.message || err.message);
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exitCode = 1;
});
