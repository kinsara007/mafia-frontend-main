"use client";

import { TrophyIcon } from "@/icons";
import { ROLE_META, type Player } from "@/lib/types";

type Winner = "MAFIA" | "VILLAGER";

interface Props {
  winner: Winner;
  players: Player[];
  currentUserId: string;
  onLeave: () => void;
}

export function GameOverScreen({ winner, players, currentUserId, onLeave }: Props) {
  const isMafiaWin = winner === "MAFIA";
  const sorted = [...players].sort((a, b) => Number(b.isAlive) - Number(a.isAlive));

  return (
    <div
      className="min-h-screen flex flex-col bg-bg"
      style={{
        backgroundImage: isMafiaWin
          ? "radial-gradient(ellipse at 50% 20%, rgba(231,76,60,0.08) 0%, transparent 60%)"
          : "radial-gradient(ellipse at 50% 20%, rgba(46,204,113,0.07) 0%, transparent 60%)",
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        <div className="flex flex-col items-center mb-12 text-center animate-fade-in">
          <div
            className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mb-5 ${
              isMafiaWin ? "bg-mafia/10 border-mafia/40" : "bg-doctor/10 border-doctor/40"
            }`}
          >
            <TrophyIcon size={32} className={isMafiaWin ? "text-mafia" : "text-doctor"} />
          </div>

          <p className="text-xs font-mono tracking-[0.4em] text-muted mb-2">
            {isMafiaWin ? "THE SHADOWS PREVAIL" : "JUSTICE IS SERVED"}
          </p>

          <h1
            className={`font-display text-6xl font-bold italic ${isMafiaWin ? "text-mafia" : "text-doctor"}`}
            style={{
              textShadow: isMafiaWin ? "0 0 60px rgba(231,76,60,0.4)" : "0 0 60px rgba(46,204,113,0.4)",
            }}
          >
            {isMafiaWin ? "MAFIA WINS" : "VILLAGERS WIN"}
          </h1>

          <p className="text-muted text-sm mt-3 max-w-md leading-relaxed">
            {isMafiaWin
              ? "The Mafia outwitted the town. The night claimed another village."
              : "The town united and rooted out the evil in their midst. Well played."}
          </p>
        </div>

        <div
          className="w-full max-w-2xl bg-card border border-border rounded-xl overflow-hidden shadow-xl animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="px-6 py-3.5 border-b border-border bg-surface">
            <h2 className="text-xs font-mono text-muted tracking-wider">FULL ROLE REVEAL</h2>
          </div>

          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-xs font-mono text-muted">
                <th className="text-left px-6 py-3">Player</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Team</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((player) => {
                const roleMeta = ROLE_META[player.role];
                const isWinner =
                  (isMafiaWin && player.role === "Mafia") || (!isMafiaWin && player.role !== "Mafia");
                return (
                  <tr key={player.id} className="border-b border-border/50 transition-colors hover:bg-card-hover">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-mono font-semibold text-white ${roleMeta.bgClass} border ${roleMeta.borderClass}`}
                        >
                          {player.initials}
                        </div>
                        <span className="text-sm text-text">{player.name}</span>
                        {player.id === currentUserId && (
                          <span className="text-[10px] font-mono text-muted">(you)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${roleMeta.badgeClass}`}>
                        {player.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-mono ${player.isAlive ? "text-doctor" : "text-danger"}`}>
                        {player.isAlive ? "● Survived" : "✕ Eliminated"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-mono ${isWinner ? "text-gold font-semibold" : "text-muted"}`}>
                        {isWinner ? "★ Winner" : "Lost"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 mt-8 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <button
            onClick={onLeave}
            className="px-8 py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/20 transition-all duration-200"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}
