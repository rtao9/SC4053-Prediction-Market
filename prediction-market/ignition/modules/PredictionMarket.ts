import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PredictionMarketModule", (m) => {
  // 1. Use Hardhat local accounts
  const deployer = m.getAccount(0);
  const owner = m.getAccount(1);
  const arbitrator1 = m.getAccount(2);
  const arbitrator2 = m.getAccount(3);

  const arbitrators = [arbitrator1, arbitrator2];

  // 2. Deploy correctly (note: args array, then options object)
  const predictionMarket = m.contract("PredictionMarket", [arbitrators, owner], {
    from: deployer,
  });

  // 3. Return exported contract
  return { predictionMarket };
});
