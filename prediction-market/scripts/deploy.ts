import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { network } from "hardhat";

const { ethers } = await network.connect();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Deploying PredictionMarket...");
  const [deployer, arbitrator] = await ethers.getSigners();

  // You can use either the second signer or a fixed address as the arbitrator
  const arbitratorAddress = arbitrator.address; // or hardcode: "0x1234..."

  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const contract = await PredictionMarket.deploy(arbitratorAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`Deployed at ${address}`);

  // Write to deployed_addresses.json (same format Ignition uses)
  const chainId = (await ethers.provider.getNetwork()).chainId.toString();
  const dir = path.join(__dirname, `../ignition/deployments/chain-${chainId}`);
  const file = path.join(dir, "deployed_addresses.json");
  fs.mkdirSync(dir, { recursive: true });

  let json: Record<string, string> = {};
  if (fs.existsSync(file)) {
    json = JSON.parse(fs.readFileSync(file, "utf8"));
  }

  json["PredictionMarketModule#PredictionMarket"] = address;
  fs.writeFileSync(file, JSON.stringify(json, null, 2));

  console.log(`Address saved to ${file}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
