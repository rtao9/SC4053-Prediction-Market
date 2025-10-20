import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PredictionMarketModule = buildModule("PredictionMarketModule", (m) => {
  // Deploy the PredictionMarket contract
  const predictionMarket = m.contract("PredictionMarket");

  // Optionally, export it for other modules or scripts to use
  return { predictionMarket };
});

export default PredictionMarketModule;
