"use client";

import { useState } from "react";
import { Address } from "@scaffold-ui/components";
import { useAccount } from "wagmi";
import { ArrowRightIcon, CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract, useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export type Filter = "all" | "active" | "closed";

const voteLabel = (count: number) => {
  if (count % 10 === 1 && count % 100 !== 11) return "голос";
  if ([2, 3, 4].includes(count % 10) && (count % 100 < 12 || count % 100 > 14)) return "голоса";
  return "голосов";
};

export const ProposalCard = ({ proposalId, filter, now }: { proposalId: bigint; filter: Filter; now: number }) => {
  const { address } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { data: proposal, isLoading } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "getProposal",
    args: [proposalId],
  });
  const { data: hasVoted } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "hasVoted",
    args: [proposalId, address],
  });
  const { writeContractAsync, isMining } = useScaffoldWriteContract({ contractName: "DecentralizedVoting" });
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  if (isLoading || !proposal) {
    return (
      <div className="voting-card min-h-64 flex items-center justify-center">
        <span className="loading loading-spinner loading-md" />
      </div>
    );
  }

  const ended = now >= Number(proposal.endsAt) * 1000;
  if ((filter === "active" && ended) || (filter === "closed" && !ended)) return null;

  const total = Number(proposal.totalVotes);
  const endDate = new Date(Number(proposal.endsAt) * 1000).toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const canVote = !!address && !ended && hasVoted === false;

  const vote = async () => {
    if (selectedOption === null) return;
    try {
      const result = await writeContractAsync({ functionName: "vote", args: [proposalId, BigInt(selectedOption)] });
      if (result) {
        notification.success("Голос учтён в блокчейне.");
        setSelectedOption(null);
      }
    } catch {
      // The Scaffold hook displays transaction errors.
    }
  };

  return (
    <article className="voting-card flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-base-content/50">#{String(proposalId + 1n).padStart(3, "0")}</span>
        <span className={`status-pill ${ended ? "status-closed" : "status-active"}`}>
          <span className="status-dot" />
          {ended ? "Завершено" : "Идёт голосование"}
        </span>
      </div>
      <h3 className="text-xl font-semibold leading-snug mt-5 mb-2 break-words">{proposal.title}</h3>
      {proposal.description && (
        <p className="text-sm text-base-content/60 mt-0 mb-5 break-words whitespace-pre-wrap">{proposal.description}</p>
      )}

      <div className="mt-auto grid gap-3 pt-3">
        {proposal.options.map((option, index) => {
          const count = Number(proposal.voteCounts[index]);
          const percent = total ? Math.round((count / total) * 100) : 0;
          return (
            <button
              key={index}
              type="button"
              className={`vote-option text-left ${selectedOption === index ? "vote-option-selected" : ""}`}
              disabled={!canVote || isMining}
              onClick={() => setSelectedOption(index)}
              aria-pressed={selectedOption === index}
            >
              <span className="vote-progress" style={{ width: `${percent}%` }} />
              <span className="relative z-10 flex items-center gap-2 min-w-0">
                <span className="option-radio" />
                <span className="truncate">{option}</span>
              </span>
              <span className="relative z-10 text-xs font-mono shrink-0">{percent}%</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-base-content/50 mt-5 gap-3">
        <span>
          {total} {voteLabel(total)}
        </span>
        <span className="flex items-center gap-1">
          <ClockIcon className="w-3.5 h-3.5" />
          {endDate}
        </span>
      </div>
      <div className="mt-5 border-t border-base-300 pt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-base-content/50 shrink-0">Автор</span>
          <Address address={proposal.creator} chain={targetNetwork} size="xs" />
        </div>
        {canVote ? (
          <button
            type="button"
            className="btn btn-primary btn-sm shrink-0"
            onClick={vote}
            disabled={selectedOption === null || isMining}
          >
            {isMining ? <span className="loading loading-spinner loading-xs" /> : "Голосовать"}
            {!isMining && <ArrowRightIcon className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="text-xs font-medium shrink-0 flex items-center gap-1">
            {hasVoted ? (
              <>
                <CheckCircleIcon className="w-4 h-4" /> Вы проголосовали
              </>
            ) : ended ? (
              "Опрос закрыт"
            ) : (
              "Подключите кошелёк"
            )}
          </span>
        )}
      </div>
    </article>
  );
};
