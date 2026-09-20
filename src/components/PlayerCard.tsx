"use client";

import { CrownIcon, SkullIcon } from "@/icons";
import type { Player } from "@/lib/types";
import { ROLE_META } from "@/lib/types";

interface Props {
  player: Player;
  variant?: "lobby" | "game";
  selected?: boolean;
  isMyVote?: boolean;
  onClick?: () => void;
  showRole?: boolean;
  disabled?: boolean;
  voteCount?: number;
}

const AVATAR_COLORS = [
  "bg-mafia/80",
  "bg-detective/80",
  "bg-doctor/80",
  "bg-villager/60",
  "bg-gold/60",
  "bg-mafia/60",
  "bg-detective/40",
  "bg-doctor/40",
];

export function PlayerCard({
  player,
  variant = "lobby",
  selected,
  isMyVote,
  onClick,
  showRole,
  disabled,
  voteCount,
}: Props) {
  const isDead = !player.isAlive;
  const roleMeta = ROLE_META[player.role];
  const avatarColor = AVATAR_COLORS[player.userId % AVATAR_COLORS.length] ?? "bg-subtle";
  const isClickable = !!onClick && !disabled && !isDead;

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      className={[
        "relative w-full text-left rounded-lg border transition-all duration-200 p-3",
        isDead ? "opacity-40 grayscale cursor-default" : "",
        isClickable && !selected ? "cursor-pointer hover:border-border-bright hover:bg-card-hover" : "",
        selected ? "border-gold/60 bg-gold/5 shadow-[0_0_0_1px_rgba(201,168,92,0.3)]" : "border-border bg-card",
        isMyVote ? "ring-1 ring-gold/40" : "",
        disabled && !isDead ? "cursor-not-allowed opacity-60" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-gold flex items-center justify-center">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
            <polyline
              points="20 6 9 17 4 12"
              strokeWidth="3"
              stroke="white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}

      {isMyVote && !selected && (
        <span className="absolute top-2 right-2 text-[10px] font-mono text-gold font-medium">your vote</span>
      )}

      <div className="flex items-center gap-3">
        <div className={`relative flex-shrink-0 w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center`}>
          <span className="text-xs font-semibold font-mono text-white">{player.initials}</span>
          {isDead && (
            <span className="absolute -bottom-0.5 -right-0.5 text-danger">
              <SkullIcon size={12} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-medium ${isDead ? "line-through text-muted" : "text-text"}`}>
              {player.name}
            </span>
            {player.isHost && (
              <span className="text-gold" title="Host">
                <CrownIcon size={11} />
              </span>
            )}
          </div>

          {(showRole || isDead) && (
            <span className={`mt-0.5 inline-block text-[10px] font-mono px-1.5 py-0.5 rounded ${roleMeta.badgeClass}`}>
              {roleMeta.label}
            </span>
          )}

          {variant === "lobby" && !showRole && !isDead && (
            <span className="text-[11px] text-muted">Player</span>
          )}
        </div>

        {voteCount !== undefined && voteCount > 0 && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-danger/20 border border-danger/40 flex items-center justify-center">
            <span className="text-[11px] font-mono font-bold text-danger">{voteCount}</span>
          </div>
        )}
      </div>
    </button>
  );
}
