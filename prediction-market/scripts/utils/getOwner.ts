import { network } from "hardhat";
import { getDeployedAddress } from "./getDeployedAddress";

const { ethers } = await network.connect();
const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {moduleName: "PredictionMarketModule",});

async function main() {
  const predictionMarket = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);

  const owner = await predictionMarket.ownerAddress();
  console.log("Contract owner:", owner);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
