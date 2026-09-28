import { expect } from "chai";
import { network } from "hardhat";
import type { Abi_DecentralizedVoting } from "../generated/abis/DecentralizedVoting.js";
import { loadAndExecuteDeploymentsFromFiles } from "../rocketh/environment.js";

const { provider, networkHelpers, ethers } = await network.create();

async function deployFixture() {
  const env = await loadAndExecuteDeploymentsFromFiles({ provider });
  const { address, abi } = env.get<Abi_DecentralizedVoting>("DecentralizedVoting");
  const voting = await ethers.getContractAt(abi, address);
  const [, alice, bob] = await ethers.getSigners();
  const aliceVoting = await ethers.getContractAt(abi, address, alice);
  const bobVoting = await ethers.getContractAt(abi, address, bob);
  return { voting, aliceVoting, bobVoting, alice, bob };
}

describe("DecentralizedVoting", function () {
  it("creates a poll with its options and deadline", async function () {
    const { voting, aliceVoting, alice } = await networkHelpers.loadFixture(deployFixture);
    await expect(aliceVoting.createProposal("Question", "Details", ["Yes", "No"], 3600)).to.emit(
      voting,
      "ProposalCreated",
    );

    const proposal = await voting.getProposal(0);
    expect(proposal.creator).to.equal(alice.address);
    expect(proposal.options).to.deep.equal(["Yes", "No"]);
    expect(proposal.voteCounts).to.deep.equal([0n, 0n]);
    expect(await voting.proposalCount()).to.equal(1n);
  });

  it("counts one vote per address per poll", async function () {
    const { voting, aliceVoting, bobVoting, alice } = await networkHelpers.loadFixture(deployFixture);
    await voting.createProposal("Question", "", ["Yes", "No"], 3600);
    await aliceVoting.vote(0, 1);
    await bobVoting.vote(0, 1);

    const proposal = await voting.getProposal(0);
    expect(proposal.voteCounts).to.deep.equal([0n, 2n]);
    expect(proposal.totalVotes).to.equal(2n);
    expect(await voting.hasVoted(0, alice.address)).to.equal(true);
    await expect(aliceVoting.vote(0, 0)).to.be.revertedWithCustomError(voting, "AlreadyVoted");

    await voting.createProposal("Another question", "", ["A", "B"], 3600);
    await aliceVoting.vote(1, 0);
    expect((await voting.getProposal(1)).totalVotes).to.equal(1n);
  });

  it("rejects invalid polls and choices", async function () {
    const { voting } = await networkHelpers.loadFixture(deployFixture);
    await expect(voting.createProposal("", "", ["Yes", "No"], 3600)).to.be.revertedWithCustomError(
      voting,
      "InvalidTitle",
    );
    await expect(voting.createProposal("Question", "", ["Only one"], 3600)).to.be.revertedWithCustomError(
      voting,
      "InvalidOptions",
    );
    await expect(voting.createProposal("Question", "", ["Yes", "No"], 59)).to.be.revertedWithCustomError(
      voting,
      "InvalidDuration",
    );
    await expect(voting.getProposal(0)).to.be.revertedWithCustomError(voting, "ProposalNotFound");
    await voting.createProposal("Question", "", ["Yes", "No"], 3600);
    await expect(voting.vote(0, 2)).to.be.revertedWithCustomError(voting, "InvalidOption");
  });

  it("closes voting at the deadline", async function () {
    const { voting } = await networkHelpers.loadFixture(deployFixture);
    await voting.createProposal("Question", "", ["Yes", "No"], 3600);
    const proposal = await voting.getProposal(0);
    await networkHelpers.time.increaseTo(proposal.endsAt);
    await expect(voting.vote(0, 0)).to.be.revertedWithCustomError(voting, "VotingClosed");
  });
});
