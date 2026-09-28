// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title DecentralizedVoting
/// @notice Open, wallet-based polls. Each address can vote once per poll.
contract DecentralizedVoting {
    uint256 public constant MIN_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 30 days;
    uint256 public constant MAX_OPTIONS = 8;

    struct Proposal {
        address creator;
        string title;
        string description;
        uint64 createdAt;
        uint64 endsAt;
        uint256 totalVotes;
        string[] options;
        uint256[] voteCounts;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) private proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(uint256 indexed proposalId, address indexed creator, uint64 endsAt);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 optionIndex);

    error InvalidTitle();
    error InvalidDescription();
    error InvalidOptions();
    error InvalidDuration();
    error ProposalNotFound();
    error VotingClosed();
    error AlreadyVoted();
    error InvalidOption();

    function createProposal(
        string calldata title,
        string calldata description,
        string[] calldata options,
        uint256 duration
    ) external returns (uint256 proposalId) {
        if (bytes(title).length == 0 || bytes(title).length > 120) revert InvalidTitle();
        if (bytes(description).length > 1000) revert InvalidDescription();
        if (options.length < 2 || options.length > MAX_OPTIONS) revert InvalidOptions();
        if (duration < MIN_DURATION || duration > MAX_DURATION) revert InvalidDuration();

        proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        proposal.creator = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.createdAt = uint64(block.timestamp);
        proposal.endsAt = uint64(block.timestamp + duration);

        for (uint256 i; i < options.length; ++i) {
            if (bytes(options[i]).length == 0 || bytes(options[i]).length > 80) revert InvalidOptions();
            proposal.options.push(options[i]);
            proposal.voteCounts.push(0);
        }

        emit ProposalCreated(proposalId, msg.sender, proposal.endsAt);
    }

    function vote(uint256 proposalId, uint256 optionIndex) external {
        if (proposalId >= proposalCount) revert ProposalNotFound();
        Proposal storage proposal = proposals[proposalId];
        if (block.timestamp >= proposal.endsAt) revert VotingClosed();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();
        if (optionIndex >= proposal.options.length) revert InvalidOption();

        hasVoted[proposalId][msg.sender] = true;
        proposal.voteCounts[optionIndex] += 1;
        proposal.totalVotes += 1;

        emit VoteCast(proposalId, msg.sender, optionIndex);
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        if (proposalId >= proposalCount) revert ProposalNotFound();
        return proposals[proposalId];
    }
}
