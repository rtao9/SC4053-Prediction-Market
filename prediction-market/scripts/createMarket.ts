import { network } from "hardhat";
import { getDeployedAddress } from "./utils/getDeployedAddress";

const { ethers } = await network.connect();
const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {moduleName: "PredictionMarketModule",});

//createMarket:
async function createMarket(contract: any, creator: any, description: any, resDuration: any) {
  // Inputs
  //const description = "Test 1: True or False?";
  const latestBlock = await ethers.provider.getBlock("latest");    // Use the blockchain's current timestamp instead of Date.now()
  const currentTime = Number(latestBlock.timestamp);
  //const resolutionDuration = 3600

  const lag = 5;
  await ethers.provider.send("evm_setNextBlockTimestamp", [currentTime + lag]);
  await ethers.provider.send("evm_mine", []);
  const resolutionTime = currentTime + resDuration + lag;

  const tx = await contract.connect(creator).createMarket(description, resolutionTime);
  await tx.wait();

  // Logging
  console.log(`Creating market on contract: ${CONTRACT_ADDRESS}`);
  console.log(`Current block time: ${currentTime}`);
  console.log(`Resolution time set to: ${resolutionTime}`);
  console.log(`Market created successfully by ${creator.address}`);
}

async function main() {
  const predictionMarket = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);
  const [, ...users] = await ethers.getSigners();

  const numMarkets = 10;
  for (let i = 1; i <= numMarkets; i++) {
    const creator = users[Math.floor(Math.random() * users.length)];
    const description = "Market1: Yes or No"
    const resDuration = 600 * i
    console.log(`======== Creating Market ${i} ========`)
    await createMarket(predictionMarket, creator, description, resDuration);
  }


  console.log("Task completed: createMarket");
}

main().catch((error) => {
  console.error("Error creating market:", error);
  process.exitCode = 1;
});
