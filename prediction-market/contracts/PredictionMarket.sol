pragma solidity ^0.8.28;

contract PredictionMarket {
    
    uint256 public marketCountl;

    enum MarketStatus { Open, Closed, Resolved }
    enum Outcome { Undecided, Yes, No }

    struct Market {
        address creator;
        string description;
        MarketStatus status;
        Outcome outcome;
        uint256 totalYesBets;
        uint256 totalNoBets;
        uint256 resolutionTime;
        mapping(address => uint256) playerStakes;
        mapping(address => bool) betsYes;
    }

    mapping(uint256 => Market) public markets;

    event MarketCreated(uint256 marketId, address creator, string description);
    event BetPlaced(uint256 marketId, address bettor, bool betsYes, uint256 amount);
    event MarketResolved(uint256 marketId, Outcome outcome);
    event PayoutClaimed(uint256 marketId, address bettor, uint256 amount, string description);

    function createMarket(string memory _description, uint256 _resolutionTime) external {
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_resolutionTime > block.timestamp, "Resolution time must be in the future");

        marketCountl++;
        Market storage newMarket = markets[marketCountl];
        newMarket.creator = msg.sender;
        newMarket.description = _description;
        newMarket.status = MarketStatus.Open;
        newMarket.resolutionTime = _resolutionTime;

        emit MarketCreated(marketCountl, msg.sender, _description);
    }

    function placeBet(uint256 _marketId, bool _prediction) external payable {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Open, "Market is not open for betting");
        require(block.timestamp < market.resolutionTime, "Betting period has ended");
        require(msg.value > 0, "Bet amount must be greater than zero");
        require(_prediction == true || _prediction == false, "Invalid prediction");

        if (_prediction) {
            market.totalYesBets += msg.value;
            market.betsYes[msg.sender] = true;
        } else {
            market.totalNoBets += msg.value;
            market.betsYes[msg.sender] = false;
        }
        market.playerStakes[msg.sender] += msg.value;

        emit BetPlaced(_marketId, msg.sender, _prediction, msg.value);
    }

    function resolveMarket(uint256 _marketId, bool _outcome) external {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Open, "Market is not open");
        require(block.timestamp >= market.resolutionTime, "Resolution time has not been reached");
        require(msg.sender == market.creator, "Only the market creator can resolve the market");
        require(_outcome == true || _outcome == false, "Invalid outcome");
        require(market.outcome == Outcome.Undecided, "Market has already been resolved");

        market.status = MarketStatus.Resolved;
        market.outcome = _outcome ? Outcome.Yes : Outcome.No;

        emit MarketResolved(_marketId, market.outcome);
    }

    function calculatePayout(uint256 _marketId, address _bettor) external view returns (uint256) {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Resolved, "Market is not resolved");

        uint256 bettorStake = market.playerStakes[_bettor];
        if (bettorStake == 0) {
            return 0;
        }

        bool bettorPrediction = market.betsYes[_bettor];
        if ((market.outcome == Outcome.Yes && bettorPrediction) || (market.outcome == Outcome.No && !bettorPrediction)) {
            uint256 totalWinningBets = market.outcome == Outcome.Yes ? market.totalYesBets : market.totalNoBets;
            uint256 totalLosingBets = market.outcome == Outcome.Yes ? market.totalNoBets : market.totalYesBets;

            return bettorStake + (bettorStake * totalLosingBets) / totalWinningBets;
        } else {
            return 0;
        }
    }

    function claimPayout(uint256 _marketId) external {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        uint256 payout = this.calculatePayout(_marketId, msg.sender);
        require(payout > 0, "No payout available");

        Market storage market = markets[_marketId];
        market.playerStakes[msg.sender] = 0;

        payable(msg.sender).transfer(payout);

        emit PayoutClaimed(_marketId, msg.sender, payout, "Payout Claimed");
    }

    function getMarketCount() external view returns(uint256 _marketCount){
        return marketCountl;
    }

    function getMarketDetails(uint256 _marketId) external view returns (
        address creator,
        string memory description,
        MarketStatus status,
        Outcome outcome,
        uint256 totalYesBets,
        uint256 totalNoBets,
        uint256 resolutionTime
    ){
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");
        Market storage market = markets[_marketId];
        return (
            market.creator,
            market.description,
            market.status,
            market.outcome,
            market.totalYesBets,
            market.totalNoBets,
            market.resolutionTime
        );
    }

    function getBettorStake(uint256 _marketId, address _bettor) external view returns (uint256 stake, bool votedYes){
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        return (market.playerStakes[_bettor], market.betsYes[_bettor]);
    }

    function getMarketOutcome(uint256 _marketId) external view returns (Outcome outcome){
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        return (market.outcome);
    }

}
