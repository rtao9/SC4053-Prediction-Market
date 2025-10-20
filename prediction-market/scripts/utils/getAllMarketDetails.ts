import { network } from "hardhat";
import { getDeployedAddress } from "./getDeployedAddress";

const { ethers } = await network.connect();
const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {moduleName: "PredictionMarketModule",});

async function main() {
  const contract = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);
  const totalMarkets = await contract.getMarketCount();
  const contractBalance = await ethers.provider.getBalance(CONTRACT_ADDRESS);

  console.log(`Contract address: ${CONTRACT_ADDRESS}`);
  console.log(`Contract balance: ${ethers.formatEther(contractBalance)} ETH`);
  console.log(`Total markets: ${totalMarkets}\n`);

  for (let i = 1; i <= totalMarkets; i++) {
    try {
      const details = await contract.getMarketDetails(i);
      const creator = details[0];
      const description = details[1];
      const status = Number(details[2]);
      const outcome = Number(details[3]);
      const resolutionTime = Number(details[4]);
      const totalYesBets = ethers.formatEther(details[5]);
      const totalNoBets = ethers.formatEther(details[6]);
      const totalYesVotes = Number(details[7]);
      const totalNoVotes = Number(details[8]);
      const currentTime = Number(details[9]);

      console.log(`Market #${i}`);
      console.log(`  Creator:         ${creator}`);
      console.log(`  Description:     ${description}`);
      console.log(`  Status:          ${status}  (0=Open, 1=Closed, 2=Resolving)`);
      console.log(`  Outcome:         ${outcome} (0=Undecided, 1=Yes, 2=No)`);
      console.log(`  Resolution Time: ${resolutionTime}`);
      console.log(`  Current Time:    ${currentTime}`);
      console.log(`  Yes Bets:        ${totalYesBets} ETH`);
      console.log(`  No Bets:         ${totalNoBets} ETH`);
      console.log(`  Yes Votes:       ${totalYesVotes}`);
      console.log(`  No Votes:        ${totalNoVotes}`);
      console.log("---------------------------------------------");
    } catch (err: any) {
      console.log(`Failed to fetch details for Market ${i}: ${err.message}`);
    }
  }

  console.log("Task completed: getAllMarketDetails");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
