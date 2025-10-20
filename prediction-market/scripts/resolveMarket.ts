import { network } from "hardhat";
import { getDeployedAddress } from "./utils/getDeployedAddress";

const { ethers } = await network.connect();

const CONTRACT_ADDRESS = getDeployedAddress("PredictionMarket", {
  moduleName: "PredictionMarketModule",
});

const MARKET_ID = 1;   // Market to resolve
const OUTCOME = true;  // true = YES, false = NO

async function main() {
  const [deployer, user, arbitrator] = await ethers.getSigners();
  const predictionMarket = await ethers.getContractAt("PredictionMarket", CONTRACT_ADDRESS);

  console.log("---------------------------------------------------");
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`Attempting to resolve market ${MARKET_ID}`);
  console.log(`Intended outcome: ${OUTCOME ? "YES" : "NO"}`);
  console.log("---------------------------------------------------");

  // Read market details
  const details = await predictionMarket.getMarketDetails(MARKET_ID);
  const creator = details[0];
  const resolutionTime = Number(details[6]);

  const arbitratorAddress = await predictionMarket.arbitrator();
  console.log(`Creator: ${creator}`);
  console.log(`Arbitrator: ${arbitratorAddress}`);

  // Select the correct signer
  let resolver;
  if (deployer.address.toLowerCase() === creator.toLowerCase()) {
    resolver = deployer;
    console.log("Resolver selected: Creator (deployer)");
  } else if (deployer.address.toLowerCase() === arbitratorAddress.toLowerCase()) {
    resolver = deployer;
    console.log("Resolver selected: Arbitrator (deployer)");
  } else if (arbitrator.address.toLowerCase() === arbitratorAddress.toLowerCase()) {
    resolver = arbitrator;
    console.log("Resolver selected: Arbitrator account");
  } else {
    console.log("No valid resolver found among known signers.");
    return;
  }

  // Make sure resolution time has passed
  const latestBlock = await ethers.provider.getBlock("latest");
  if (latestBlock.timestamp < resolutionTime) {
    const secondsToAdvance = resolutionTime - latestBlock.timestamp + 5;
    try {
      await ethers.provider.send("evm_increaseTime", [secondsToAdvance]);
      await ethers.provider.send("evm_mine", []);
      console.log(`Advanced time by ${secondsToAdvance} seconds.`);
    } catch {
      console.log("Skipping time increase (not supported on this network).");
    }
  }

  // Attempt to resolve
  try {
    const tx = await predictionMarket
      .connect(resolver)
      .resolveMarket(MARKET_ID, OUTCOME);
    await tx.wait();
    console.log(`Market ${MARKET_ID} resolved to outcome: ${OUTCOME ? "YES" : "NO"}`);
  } catch (err: any) {
    console.error("Failed to resolve market:", err?.error?.message || err.message);
    return;
  }

  // Verify new status
  const updated = await predictionMarket.getMarketDetails(MARKET_ID);
  console.log("---------------------------------------------------");
  console.log(`Updated market status: ${updated[2]} (2 = Resolved)`);
  console.log(`Updated outcome: ${updated[3]} (1 = YES, 2 = NO)`);
  console.log("---------------------------------------------------");
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exitCode = 1;
});
