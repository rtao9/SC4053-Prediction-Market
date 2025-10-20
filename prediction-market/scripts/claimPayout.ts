import { network } from "hardhat";
import { getDeployedAddress } from "./utils/getDeployedAddress";

const { ethers } = await network.connect();

const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {moduleName: "PredictionMarketModule",});
const MARKET_ID = 1;

async function main() {
  const [bettor] = await ethers.getSigners();
  const predictionMarket = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);

  const tx = await predictionMarket.connect(bettor).claimPayout(MARKET_ID);
  await tx.wait();

  console.log(`Payout claimed by ${bettor.address} for market ${MARKET_ID}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
