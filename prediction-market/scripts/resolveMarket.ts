import { network } from "hardhat";
import { getDeployedAddress } from "./utils/getDeployedAddress";

const { ethers } = await network.connect();

const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {moduleName: "PredictionMarketModule",});
const MARKET_ID = 1; // Example market
const OUTCOME = true; // true = Yes wins, false = No wins

async function main() {
  const [creator] = await ethers.getSigners();
  const predictionMarket = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);

  const tx = await predictionMarket.connect(creator).resolveMarket(MARKET_ID, OUTCOME);
  await tx.wait();

  console.log(`Market ${MARKET_ID} resolved to outcome: ${OUTCOME ? "YES" : "NO"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
