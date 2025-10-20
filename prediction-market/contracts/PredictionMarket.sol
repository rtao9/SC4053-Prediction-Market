pragma solidity ^0.8.28;
import "hardhat/console.sol";

contract PredictionMarket {
    
    uint256 public marketCountl;
    address public ownerAddress;
    mapping(address => bool) public isArbitrator;

    enum MarketStatus { Open, Closed, Resolving }
    enum Outcome { Undecided, Yes, No }

    struct Market {
        address creator;
        string description;
        MarketStatus status;
        Outcome outcome;
        uint256 resolutionTime;
        uint256 totalYesBets;
        uint256 totalNoBets;
        mapping(address => uint256) yesStakes;
        mapping(address => uint256) noStakes;
        uint256 totalYesVotes;
        uint256 totalNoVotes;
        mapping(address => bool) voters;
    }

    mapping(uint256 => Market) public markets;

    event MarketCreated(uint256 marketId, address creator, string description, uint256 resolutionTime);
    event BetPlaced(uint256 marketId, address bettor, bool betsYes, uint256 amount);
    event MarketResolving(uint256 marketId, address votedBy, bool vote);
    event MarketClosed(uint256 marketId, address closedBy, Outcome outcome);
    event PayoutClaimed(uint256 marketId, address bettor, uint256 amount, string description);
    event ArbitratorChanged(address newArbitrator, bool status);

    constructor(address[] memory _arbitrators, address owner) {
        ownerAddress = owner;
        for (uint i = 0; i < _arbitrators.length; i++) {
            isArbitrator[_arbitrators[i]] = true;
        }
        isArbitrator[ownerAddress] = true;     // set Owner as an arbitrator as well
    }

    modifier onlyOwner() {
        require(msg.sender == ownerAddress, "Only owner can perform this action");
        _;
    }

    modifier onlyArbitrator() {
        require(isArbitrator[msg.sender], "Only arbitrator can perform this action");
        _;
    }

    modifier onlyCreator(uint256 _marketId) {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");
        require(msg.sender == markets[_marketId].creator, "Only market creator can perform this action");
        _;
    }

    function addArbitrator(address _address) external onlyOwner {
        require(_address != address(0), "Invalid arbitrator address");
        require(!isArbitrator[_address], "Address is already an arbitrator");
        isArbitrator[_address] = true;
        emit ArbitratorChanged(_address, true);
    }

    function removeArbitrator(address _address) external onlyOwner {
        require(_address != address(0), "Invalid arbitrator address");
        require(isArbitrator[_address], "Address is already not an arbitrator");
        isArbitrator[_address] = false;
        emit ArbitratorChanged(_address, false);
    }

    function createMarket(string memory _description, uint256 _resolutionTime) external {
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_resolutionTime > block.timestamp, "Resolution time must be in the future");
        console.log("Current block timestamp:", block.timestamp);   // TODO: Remove later

        marketCountl++;
        Market storage newMarket = markets[marketCountl];
        newMarket.creator = msg.sender;
        newMarket.description = _description;
        newMarket.status = MarketStatus.Open;
        newMarket.resolutionTime = _resolutionTime;

        emit MarketCreated(marketCountl, msg.sender, _description, _resolutionTime);
    }

    function placeBet(uint256 _marketId, bool _prediction) external payable {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Open, "Market is not open for betting");
        require(block.timestamp < market.resolutionTime, "Betting period has ended");
        require(msg.value > 0, "Bet amount must be greater than zero");
        require(_prediction == true || _prediction == false, "Invalid prediction");
        require(address(msg.sender).balance > msg.value, "Insufficient balance");

        if (_prediction) {
            market.totalYesBets += msg.value;
            market.yesStakes[msg.sender] += msg.value;
        } else {
            market.totalNoBets += msg.value;
            market.noStakes[msg.sender] = msg.value;
        }

        emit BetPlaced(_marketId, msg.sender, _prediction, msg.value);
    }

    function voteMarketResult(uint256 _marketId, bool _outcome) external {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        require(msg.sender == market.creator || isArbitrator[msg.sender] == true, "Only the market creator or an arbitrator can resolve the market");
        require(!market.voters[msg.sender], "You have already casted your vote in this market");
        require(market.status != MarketStatus.Closed, "Market has closed, you can no longer cast your vote");
        require(block.timestamp >= market.resolutionTime, "Resolution time has not been reached");
        require(_outcome == true || _outcome == false, "Invalid outcome");

        market.status = MarketStatus.Resolving;
        
        if (_outcome == true) {
            market.totalYesVotes++;
        } else {
            market.totalNoVotes++;
        }

        market.voters[msg.sender] = true;
        emit MarketResolving(_marketId, msg.sender, _outcome);
    }

    function closeMarket(uint256 _marketId) external {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        require(msg.sender == market.creator || isArbitrator[msg.sender] == true, "Only the market creator or an arbitrator can close the market");
        require(market.status == MarketStatus.Resolving, "Market must be in the resolving status");
        require(block.timestamp >= market.resolutionTime + 3600, "Closure time has not been reached");
        
        market.status = MarketStatus.Closed;
        if (market.totalYesVotes > market.totalNoVotes) {
            market.outcome = Outcome.Yes;
        } else if (market.totalNoVotes > market.totalYesVotes) {
            market.outcome = Outcome.No;
        } else {
            market.outcome = Outcome.Undecided;
        }
        
        emit MarketClosed(_marketId, msg.sender, market.outcome);
    }

    function calculatePayout(uint256 _marketId, address _bettor) external view returns (uint256) {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Closed, "Market is still resolving");
        require(market.yesStakes[_bettor] > 0 || market.noStakes[_bettor] > 0, "You do not have any ongoing bets");

        uint256 bettorStake;
        if (market.outcome == Outcome.Yes) {
            bettorStake = market.yesStakes[_bettor];
        } else if (market.outcome == Outcome.No) {
            bettorStake = market.noStakes[_bettor];
        }

        uint256 totalWinningBets = market.outcome == Outcome.Yes ? market.totalYesBets : market.totalNoBets;
        uint256 totalLosingBets = market.outcome == Outcome.Yes ? market.totalNoBets : market.totalYesBets;

        return bettorStake + (bettorStake * totalLosingBets) / totalWinningBets;
    }

    function claimPayout(uint256 _marketId) external {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        uint256 payout = this.calculatePayout(_marketId, msg.sender);
        require(payout > 0, "No payout available");
        require(address(this).balance >= payout, "Insufficient contract balance"); // Sanity check contract balance

        Market storage market = markets[_marketId];

        // Clear only the winning stake
        if (market.outcome == Outcome.Yes) {
            market.yesStakes[msg.sender] = 0;
        } else if (market.outcome == Outcome.No) {
            market.noStakes[msg.sender] = 0;
        }

        //payable(msg.sender).transfer(payout);
        (bool ok, ) = payable(msg.sender).call{value: payout}("");
        require(ok, "Failed to send payout");

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
        uint256 resolutionTime,
        uint256 totalYesBets,
        uint256 totalNoBets,
        uint256 totalYesVotes,
        uint256 totalNoVotes,
        uint256 currentTime
    ){
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];

        return (
            market.creator,
            market.description,
            market.status,
            market.outcome,
            market.resolutionTime,
            market.totalYesBets,
            market.totalNoBets,
            market.totalYesVotes,
            market.totalNoVotes,
            block.timestamp
        );
    }

    function getUserBets(uint256 _marketId, address _user) external view returns (uint256 yesAmount, uint256 noAmount) {
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");
        
        Market storage market = markets[_marketId];
        return (market.yesStakes[_user], market.noStakes[_user]);
    }


    function getMarketOutcome(uint256 _marketId) external view returns (Outcome outcome){
        require(_marketId > 0 && _marketId <= marketCountl, "Invalid market ID");

        Market storage market = markets[_marketId];
        return (market.outcome);
    }

    function getOwner() external view returns (address) {
        return ownerAddress;
    }

}
