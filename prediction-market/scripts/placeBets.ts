import { network } from "hardhat";

const { ethers } = await network.connect();

const CONTRACT_ADDRESS = "<DEPLOYED_CONTRACT_ADDRESS>"; // Replace with deployed address
const MARKET_ID = 1; // Example market ID
const BET_AMOUNT = "0.01"; // ETH amount

async function main() {
  const [bettor] = await ethers.getSigners();
  const predictionMarket = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);

  const prediction = true; // true = Yes, false = No

  const tx = await predictionMarket.connect(bettor).placeBet(MARKET_ID, prediction, {
    value: ethers.parseEther(BET_AMOUNT),
  });
  await tx.wait();

  console.log(`💰 Bet placed by ${bettor.address} on market ${MARKET_ID}: ${prediction ? "YES" : "NO"} (${BET_AMOUNT} ETH)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
