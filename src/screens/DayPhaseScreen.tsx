"use client";

import { NavBar } from "@/components/NavBar";
import { PhaseHeader } from "@/components/PhaseHeader";
import { PlayerCard } from "@/components/PlayerCard";
import { ChatPanel } from "@/components/ChatPanel";
import { VoteTally } from "@/components/VoteTally";
import type { ChatMessage, ConnectionStatus, DaySubphase, Player, VoteEntry } from "@/lib/types";

interface Props {
  user: Player;
  players: Player[];
  messages: ChatMessage[];
  votes: VoteEntry[];
  myVote?: string;
  subphase: DaySubphase;
  round: number;
  timeLeft: number;
  totalTime: number;
  connectionStatus: ConnectionStatus;
  chatEnabled: boolean;
  onSend: (text: string) => void;
  onVote: (playerId: string) => void;
}

export function DayPhaseScreen({
  user,
  players,
  messages,
  votes,
  myVote,
  subphase,
  round,
  timeLeft,
  totalTime,
  connectionStatus,
  chatEnabled,
  onSend,
  onVote,
}: Props) {
  return (
    <div
      className="h-screen flex flex-col bg-bg overflow-hidden"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(201,168,92,0.03) 0%, transparent 50%)" }}
    >
      <NavBar user={user} connectionStatus={connectionStatus} />
      <PhaseHeader
        phase="DAY"
        subphase={subphase}
        round={round}
        timeLeft={timeLeft}
        totalTime={totalTime}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden min-h-0">
        <div className="w-full lg:w-56 xl:w-64 flex-shrink-0 flex flex-col min-h-0 lg:max-h-none max-h-[40vh]">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-mono text-muted tracking-wider">PLAYERS</h2>
            <span className="text-[10px] font-mono text-muted">
              {players.filter((p) => p.isAlive).length} alive
              {subphase === "VOTING" ? " · click to vote" : ""}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {players.map((player) => {
              const voteCount = votes.find((v) => v.targetId === player.id)?.voterIds.length ?? 0;
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  variant="game"
                  showRole={!player.isAlive}
                  selected={subphase === "VOTING" && player.isAlive && myVote === player.id}
                  isMyVote={myVote === player.id}
                  onClick={
                    subphase === "VOTING" && player.isAlive && player.id !== user.id && user.isAlive && !myVote
                      ? () => onVote(player.id)
                      : undefined
                  }
                  voteCount={subphase === "VOTING" && player.isAlive ? voteCount : undefined}
                />
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-w-0 min-h-0">
          <ChatPanel
            messages={messages}
            currentUserId={user.id}
            onSend={onSend}
            disabled={!chatEnabled}
          />
        </div>

        {subphase === "VOTING" && (
          <div className="w-full lg:w-56 xl:w-64 flex-shrink-0 min-h-0 flex flex-col animate-fade-in max-h-56 lg:max-h-none">
            <h2 className="text-xs font-mono text-muted tracking-wider mb-2.5">VOTE TALLY</h2>
            <div className="flex-1 min-h-0">
              <VoteTally votes={votes} players={players} myVoteTargetId={myVote} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
