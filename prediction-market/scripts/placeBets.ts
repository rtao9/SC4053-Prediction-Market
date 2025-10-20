import { network } from "hardhat";
import { getDeployedAddress } from "./utils/getDeployedAddress";

const { ethers } = await network.connect();
const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {moduleName: "PredictionMarketModule",});

//placeBet:
async function placeBet(contract: any, marketId: any, bettor: any, prediction: any, amount: any) {
  // Inputs
  const tx = await contract.connect(bettor).placeBet(marketId, prediction, { value: ethers.parseEther(amount) });

  // Logging
  // console.log(`Submitting bet on market: ${marketId}`);
  // console.log(`Prediction made: ${prediction ? "Yes" : "No"}`);
  // console.log(`Prediction amount: ${amount}`);
  // console.log(`Bet placed successfully by ${bettor.address}`);
}

async function main() {
  const predictionMarket = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);
  const [, ...users] = await ethers.getSigners();

  const numBetters = 50;
  const numMarkets = 10
  for (let i = 1; i <= numBetters; i++) {
    const market = Math.floor(Math.random() * numMarkets) + 1;
    const bettor = users[Math.floor(Math.random() * users.length)];
    const prediction = Math.random() < 0.5;
    const betAmount = (Math.random() * (10 - 0.1) + 0.1).toFixed(2);
    await placeBet(predictionMarket, market, bettor, prediction, betAmount);
  }
  console.log("Task completed: placeBets");
}

main().catch((error) => {
  console.error("Error creating market:", error);
  process.exitCode = 1;
});
