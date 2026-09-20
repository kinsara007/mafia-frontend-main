"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { PlayerCard } from "@/components/PlayerCard";
import { CopyIcon, CheckIcon, UsersIcon } from "@/icons";
import type { ConnectionStatus, Player } from "@/lib/types";
import { MIN_PLAYERS, MAX_PLAYERS } from "@/lib/types";

interface Props {
  user: Player;
  roomCode: string;
  players: Player[];
  connectionStatus: ConnectionStatus;
  starting: boolean;
  error?: string | null;
  onStartGame: () => Promise<void>;
  onLeave: () => void;
}

export function LobbyScreen({
  user,
  roomCode,
  players,
  connectionStatus,
  starting,
  error,
  onStartGame,
  onLeave,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playerCount = players.length;
  const canStart = playerCount >= MIN_PLAYERS;

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <NavBar user={user} connectionStatus={connectionStatus} onLeave={onLeave} />

      <main className="flex-1 flex flex-col items-center px-8 py-10 max-w-4xl mx-auto w-full">
        <div className="w-full text-center mb-10">
          <p className="text-xs font-mono text-muted tracking-[0.3em] mb-3">ROOM CODE</p>
          <div className="inline-flex items-center gap-4 bg-card border border-border-bright rounded-2xl px-8 py-5">
            <span className="font-mono text-4xl font-bold text-gold tracking-[0.25em]">{roomCode}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface border border-border hover:border-gold/30 text-muted hover:text-gold transition-all text-xs font-mono"
            >
              {copied ? (
                <>
                  <CheckIcon size={12} className="text-doctor" /> Copied!
                </>
              ) : (
                <>
                  <CopyIcon size={12} /> Copy
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">
            Share this code with up to {MAX_PLAYERS} friends to join your room.
          </p>
        </div>

        <div className="w-full flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-muted">
              <UsersIcon size={14} />
              <span className="text-sm font-mono">
                <span className={canStart ? "text-doctor" : "text-warning"}>{playerCount}</span>
                <span> / {MAX_PLAYERS} players</span>
              </span>
            </div>
            {!canStart && (
              <span className="text-xs text-muted font-mono">
                Need {MIN_PLAYERS - playerCount} more player
                {MIN_PLAYERS - playerCount !== 1 ? "s" : ""} to start
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} variant="lobby" />
            ))}

            {Array.from({ length: Math.max(0, MIN_PLAYERS - playerCount) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="rounded-lg border border-dashed border-border p-3 flex items-center gap-3 opacity-40"
              >
                <div className="w-10 h-10 rounded-full border border-dashed border-border flex items-center justify-center">
                  <span className="text-muted text-xs font-mono">?</span>
                </div>
                <span className="text-xs text-muted">Waiting…</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full mt-8 pt-6 border-t border-border">
          {error && <p className="text-center text-xs text-danger font-mono mb-3">{error}</p>}
          {user.isHost ? (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={canStart && !starting ? onStartGame : undefined}
                disabled={!canStart || starting}
                className={[
                  "px-12 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200",
                  canStart
                    ? "bg-gold/10 border border-gold/40 text-gold hover:bg-gold/20 animate-pulse-glow cursor-pointer"
                    : "bg-subtle border border-border text-muted cursor-not-allowed opacity-60",
                ].join(" ")}
              >
                {starting
                  ? "Starting…"
                  : canStart
                    ? "Start Game"
                    : `Waiting for players… (${playerCount}/${MIN_PLAYERS})`}
              </button>
              <p className="text-xs text-muted/50 font-mono">Only you can start the game as host</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse" />
                Waiting for host to start the game…
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
