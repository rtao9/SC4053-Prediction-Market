import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("PredictionMarket", function () {
  let ethers: any;
  let owner: any;
  let alice: any;
  let bob: any;
  let predictionMarket: any;

  const ONE_ETH = 10n ** 18n;

  beforeEach(async function () {
    // Get ethers connected to Hardhat's local network
    ({ ethers } = await network.connect());
    [owner, alice, bob] = await ethers.getSigners();

    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
  });

  it("should deploy correctly", async function () {
    const address = await predictionMarket.getAddress();
    expect(address).to.be.properAddress;
  });

  it("should create a market", async function () {
    const description = "Will BTC hit $100k?";
    const block = await ethers.provider.getBlock("latest");
    const now = Number(block.timestamp);
    const resolutionTime = now + 3600;

    await expect(predictionMarket.createMarket(description, resolutionTime))
      .to.emit(predictionMarket, "MarketCreated");

    const count = await predictionMarket.getMarketCount();
    expect(count).to.equal(1n);
  });

  it("should allow users to place bets", async function () {
    const block = await ethers.provider.getBlock("latest");
    const now = Number(block.timestamp);
    const resolutionTime = now + 3600;
    await predictionMarket.createMarket("BTC test", resolutionTime);

    await expect(
      predictionMarket.connect(alice).placeBet(1n, true, { value: ONE_ETH })
    ).to.emit(predictionMarket, "BetPlaced");

    const [stake, votedYes] = await predictionMarket.getBettorStake(1n, alice.address);
    expect(stake).to.equal(ONE_ETH);
    expect(votedYes).to.be.true;
  });

  it("should resolve market and allow winner to claim payout", async function () {
    const block = await ethers.provider.getBlock("latest");
    const now = Number(block.timestamp);
    const resolutionTime = now + 3600; // 1 hour later
    await predictionMarket.createMarket("Resolve Test", resolutionTime);

    await predictionMarket.connect(alice).placeBet(1n, true, { value: ONE_ETH });
    await predictionMarket.connect(bob).placeBet(1n, false, { value: ONE_ETH });

    // fast forward at least 1 hour (plus a few seconds for safety)
    await ethers.provider.send("evm_increaseTime", [3605]);
    await ethers.provider.send("evm_mine", []);

    await expect(predictionMarket.resolveMarket(1n, true))
        .to.emit(predictionMarket, "MarketResolved");

    const outcome = await predictionMarket.getMarketOutcome(1n);
    expect(outcome).to.equal(1n); // Outcome.Yes

    await expect(predictionMarket.connect(alice).claimPayout(1n))
        .to.emit(predictionMarket, "PayoutClaimed");
    });
});
