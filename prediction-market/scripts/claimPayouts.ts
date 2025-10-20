import { network } from "hardhat";
import { getDeployedAddress } from "./utils/getDeployedAddress";

const { ethers } = await network.connect();
const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {moduleName: "PredictionMarketModule",});

async function main() {
  const contract = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);
  const [deployer, ...users] = await ethers.getSigners();
  const totalMarkets = await contract.getMarketCount();

  console.log(`Total markets: ${totalMarkets}`);

  for (let i = 1; i <= totalMarkets; i++) {
    for (const user of users) {
      try {
        const payout = await contract.calculatePayout(i, user.address);
        if (payout > 0n) {
          console.log(`Claiming payout for Market ${i} by ${user.address} (${ethers.formatEther(payout)} ETH)`);
          const tx = await contract.connect(user).claimPayout(i);
          await tx.wait();
          console.log(`✅ Claimed Market ${i}`);
        }
      } catch (err: any) {
        console.log(`Skipped Market ${i} for ${user.address}: ${err.message}`);
      }
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exitCode = 1;
});
