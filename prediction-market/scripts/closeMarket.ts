import { network } from "hardhat";
import { getDeployedAddress } from "./utils/getDeployedAddress";

const { ethers } = await network.connect();
const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {moduleName: "PredictionMarketModule",});

async function voteIfNeeded(contract: any, signer: any, marketId: bigint) {
  const market = await contract.getMarketDetails(marketId);
  const status = Number(market[2]);
  const resolutionTime = Number(market[4]);

  const latestBlock = await ethers.provider.getBlock("latest");
  const currentTime = latestBlock.timestamp;

  if (status === 0) {
    console.log(`Market ${marketId} is still open — voting to resolve...`);
    const forwardTime = Math.max(0, resolutionTime - currentTime + 5);
    await ethers.provider.send("evm_increaseTime", [forwardTime]);
    await ethers.provider.send("evm_mine", []);

    const voteTx = await contract.connect(signer).voteMarketResult(marketId, Math.random() < 0.5);
    await voteTx.wait();

    const updated = await contract.getMarketDetails(marketId);
    console.log(`Market ${marketId} voted successfully. New status: ${Number(updated[2])}`);
  }
}

async function closeMarket(contract: any, signer: any, marketId: bigint) {
  await voteIfNeeded(contract, signer, marketId);

  const market = await contract.getMarketDetails(marketId);
  const resolutionTime = Number(market[4]);
  
  const latestBlock = await ethers.provider.getBlock("latest");
  const currentTime = latestBlock.timestamp;

  const forwardTime = Math.max(0, resolutionTime + 3605 - currentTime);
  await ethers.provider.send("evm_increaseTime", [forwardTime]);
  await ethers.provider.send("evm_mine", []);

  console.log(`Fast-forwarded ${forwardTime}s to allow closure`);
  console.log(`Closing Market #${marketId}...`);

  const tx = await contract.connect(signer).closeMarket(marketId);
  await tx.wait();

  console.log(`Market ${marketId} closed successfully`);
}

async function main() {
  const contract = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);
  const [, ...users] = await ethers.getSigners();
  const arbitrator = users[0]; // must be an authorized arbitrator

  const numMarkets = 10;
  for (let i = 1; i <= numMarkets; i++) {
    console.log(`\n======== Closing Market ${i} ========`);
    try {
      await closeMarket(contract, arbitrator, BigInt(i));
    } catch (err: any) {
      console.log(`Could not close Market ${i}: ${err.message}`);
    }
  }

  console.log("Task completed: closeMarket");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
