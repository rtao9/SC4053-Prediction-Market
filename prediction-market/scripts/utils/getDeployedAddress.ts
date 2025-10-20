import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Returns the deployed address for a given contract from Hardhat Ignition's
 * deployed_addresses.json.
 *
 * Looks for keys like:
 *   "<ModuleName>#<ContractName>"
 * Example key: "PredictionMarketModule#PredictionMarket"
 *
 * Env overrides:
 *   - CHAIN_ID:   defaults to 31337
 *   - DEPLOYMENTS_DIR: full path to the chain folder (overrides CHAIN_ID)
 */
export function getDeployedAddress(
  contractName: string,
  opts?: { moduleName?: string; chainId?: string }
): string {
  // Recreate __dirname in ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const chainId =
    opts?.chainId ||
    process.env.CHAIN_ID ||
    "31337";

  // Allow a full custom deployments dir (useful for CI or non-standard layouts)
  const deploymentsDir =
    process.env.DEPLOYMENTS_DIR ||
    path.join(__dirname, `../../ignition/deployments/chain-${chainId}`);

  const filePath = path.join(deploymentsDir, "deployed_addresses.json");

  if (!fs.existsSync(filePath)) {
    throw new Error(`⚠️ deployed_addresses.json not found at: ${filePath}`);
  }

  const json = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, string>;

  // Preferred exact key: "<ModuleName>#<ContractName>"
  if (opts?.moduleName) {
    const exactKey = `${opts.moduleName}#${contractName}`;
    const exact = json[exactKey];
    if (exact) return exact;
  }

  // Fallback: find any key that ends with "#<ContractName>"
  const candidates = Object.entries(json).filter(([k]) =>
    k.split("#").pop() === contractName
  );

  if (candidates.length === 0) {
    throw new Error(
      `⚠️ No deployed address found for contract "${contractName}" in ${filePath}`
    );
  }
  if (candidates.length > 1) {
    const keys = candidates.map(([k]) => k).join(", ");
    throw new Error(
      `⚠️ Multiple entries found for "${contractName}": ${keys}. ` +
      `Specify moduleName (e.g. { moduleName: "PredictionMarketModule" }).`
    );
  }

  return candidates[0][1];
}
