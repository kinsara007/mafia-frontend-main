"use client";

import { NavBar } from "@/components/NavBar";
import { PhaseHeader } from "@/components/PhaseHeader";
import { PlayerCard } from "@/components/PlayerCard";
import { ActionPanel } from "@/components/ActionPanel";
import type { ConnectionStatus, Player, Role } from "@/lib/types";

interface Props {
  user: Player;
  userRole: Role;
  players: Player[];
  round: number;
  timeLeft: number;
  totalTime: number;
  connectionStatus: ConnectionStatus;
  submitted: boolean;
  submittedTarget?: string;
  onSubmit: (targetId: string) => void;
}

export function NightPhaseScreen({
  user,
  userRole,
  players,
  round,
  timeLeft,
  totalTime,
  connectionStatus,
  submitted,
  submittedTarget,
  onSubmit,
}: Props) {
  return (
    <div
      className="h-screen flex flex-col bg-bg overflow-hidden"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(61,142,248,0.04) 0%, transparent 50%)" }}
    >
      <NavBar user={user} connectionStatus={connectionStatus} />
      <PhaseHeader phase="NIGHT" round={round} timeLeft={timeLeft} totalTime={totalTime} />

      <div className="flex-1 flex flex-col lg:flex-row gap-5 p-5 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-mono text-muted tracking-wider">PLAYERS</h2>
            <span className="text-xs font-mono text-muted">
              {players.filter((p) => p.isAlive).length} alive · {players.filter((p) => !p.isAlive).length} dead
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
              {players.map((player) => (
                <PlayerCard key={player.id} player={player} variant="game" showRole={!player.isAlive} />
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 flex flex-col min-h-[280px]">
          <h2 className="text-xs font-mono text-muted tracking-wider mb-3">NIGHT ACTION</h2>
          <div className="flex-1">
            {user.isAlive ? (
              <ActionPanel
                userRole={userRole}
                players={players}
                currentUserId={user.id}
                onSubmit={onSubmit}
                submitted={submitted}
                submittedTarget={submittedTarget}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg border border-border">
                <p className="text-sm text-muted font-mono">The dead watch in silence.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
