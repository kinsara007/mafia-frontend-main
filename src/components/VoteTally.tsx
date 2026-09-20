"use client";

import { useState } from "react";
import type { Player, VoteEntry } from "@/lib/types";
import { ChevronRightIcon } from "@/icons";

interface Props {
  votes: VoteEntry[];
  players: Player[];
  myVoteTargetId?: string;
}

export function VoteTally({ votes, players, myVoteTargetId }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const sorted = [...votes].sort((a, b) => b.voterIds.length - a.voterIds.length);
  const maxVotes = sorted[0]?.voterIds.length ?? 1;
  const totalVoters = votes.reduce((acc, v) => acc + v.voterIds.length, 0);

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-mono text-muted tracking-wider">VOTE TALLY</span>
        <span className="text-xs text-muted">
          {totalVoters} / {players.filter((p) => p.isAlive).length} voted
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sorted.length === 0 ? (
          <p className="text-xs text-muted text-center py-8 font-mono">No votes yet</p>
        ) : (
          sorted.map((entry) => {
            const target = getPlayer(entry.targetId);
            if (!target) return null;
            const isLeader = entry.voterIds.length === maxVotes && entry.voterIds.length > 0;
            const isExpanded = expanded === entry.targetId;
            const isMyVoteTarget = myVoteTargetId === entry.targetId;

            return (
              <div key={entry.targetId}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : entry.targetId)}
                  className={[
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-all group",
                    isLeader ? "border-danger/40 bg-danger/5" : "border-border hover:border-border-bright",
                    isMyVoteTarget ? "ring-1 ring-gold/40" : "",
                  ].join(" ")}
                >
                  <div className="w-7 h-7 rounded-full bg-subtle border border-border-bright flex items-center justify-center text-[10px] font-mono text-muted flex-shrink-0">
                    {target.initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text">{target.name}</span>
                      <span className={`text-xs font-mono font-bold ${isLeader ? "text-danger" : "text-muted"}`}>
                        {entry.voterIds.length}
                      </span>
                    </div>
                    <div className="h-1 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isLeader ? "bg-danger" : "bg-subtle"}`}
                        style={{ width: `${(entry.voterIds.length / maxVotes) * 100}%` }}
                      />
                    </div>
                  </div>

                  <ChevronRightIcon
                    size={14}
                    className={`text-muted transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                  />
                </button>

                {isExpanded && (
                  <div className="ml-10 mt-1 px-2 py-1.5 bg-surface rounded border border-border space-y-0.5">
                    {entry.voterIds.map((vid) => {
                      const voter = getPlayer(vid);
                      return voter ? (
                        <div key={vid} className="text-xs text-muted flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-muted/50 flex-shrink-0" />
                          {voter.name}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!!myVoteTargetId && (
        <div className="flex-shrink-0 border-t border-border px-4 py-2.5">
          <p className="text-xs text-muted">
            Your vote:{" "}
            <span className="text-gold font-medium">{getPlayer(myVoteTargetId)?.name ?? "—"}</span>
            <span className="ml-2 text-muted/50">(locked until this round ends)</span>
          </p>
        </div>
      )}
    </div>
  );
}
