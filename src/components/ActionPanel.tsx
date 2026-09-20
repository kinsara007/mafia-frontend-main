"use client";

import { useState } from "react";
import { CheckIcon } from "@/icons";
import type { Player, Role } from "@/lib/types";
import { ROLE_META } from "@/lib/types";

interface Props {
  userRole: Role;
  players: Player[];
  onSubmit: (targetId: string) => void;
  submitted: boolean;
  submittedTarget?: string;
  currentUserId: string;
}

const ACTION_PROMPT: Record<Role, string> = {
  Mafia: "Choose a target to eliminate tonight.",
  Detective: "Choose a player to investigate tonight.",
  Doctor: "Choose a player to protect tonight.",
  Villager: "",
};

const ACTION_BUTTON: Record<Role, string> = {
  Mafia: "Confirm Kill",
  Detective: "Investigate",
  Doctor: "Protect",
  Villager: "",
};

export function ActionPanel({
  userRole,
  players,
  onSubmit,
  submitted,
  submittedTarget,
  currentUserId,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const meta = ROLE_META[userRole];

  if (userRole === "Villager") {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg border border-border">
        <div className="text-4xl mb-4 opacity-60">🌙</div>
        <h3 className="font-display text-lg text-muted font-semibold mb-2">Villagers Sleep</h3>
        <p className="text-sm text-muted leading-relaxed max-w-48">
          The night belongs to others. Rest and wait for dawn.
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted/50 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-muted/30 animate-pulse" />
          Waiting for night to end…
        </div>
      </div>
    );
  }

  if (submitted) {
    const targetPlayer = players.find((p) => p.id === submittedTarget);
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-card rounded-lg border border-border">
        <div className={`w-14 h-14 rounded-full ${meta.bgClass} border ${meta.borderClass} flex items-center justify-center mb-4`}>
          <CheckIcon size={24} className={meta.textClass} />
        </div>
        <h3 className={`font-display text-lg font-semibold mb-1 ${meta.textClass}`}>Action Locked In</h3>
        {targetPlayer && (
          <p className="text-sm text-muted">
            Target: <span className="text-text font-medium">{targetPlayer.name}</span>
          </p>
        )}
        <div className="mt-6 flex items-center gap-2 text-xs text-muted/50 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-muted/30 animate-pulse" />
          Waiting for others…
        </div>
      </div>
    );
  }

  const eligiblePlayers =
    userRole === "Doctor"
      ? players.filter((p) => p.isAlive)
      : players.filter((p) => p.isAlive && p.id !== currentUserId);

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <div className={`px-4 py-3 border-b ${meta.borderClass} ${meta.bgClass} flex-shrink-0`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-lg">{meta.icon}</span>
          <span className={`text-sm font-semibold font-mono tracking-wider ${meta.textClass}`}>
            {meta.label.toUpperCase()} ACTION
          </span>
        </div>
        <p className="text-xs text-muted">{ACTION_PROMPT[userRole]}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {eligiblePlayers.map((player) => (
          <button
            key={player.id}
            onClick={() => setSelected(player.id)}
            className={[
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md border text-left transition-all duration-150",
              selected === player.id
                ? `${meta.bgClass} ${meta.borderClass} shadow-sm`
                : "border-border hover:border-border-bright hover:bg-card-hover",
            ].join(" ")}
          >
            <div className="w-8 h-8 rounded-full bg-subtle flex items-center justify-center text-[11px] font-mono font-semibold text-muted flex-shrink-0">
              {player.initials}
            </div>
            <span className="text-sm text-text flex-1">
              {player.name}
              {player.id === currentUserId ? " (you)" : ""}
            </span>
            {selected === player.id && <CheckIcon size={14} className={meta.textClass} />}
          </button>
        ))}
      </div>

      <div className="flex-shrink-0 p-3 border-t border-border">
        <button
          onClick={() => selected && onSubmit(selected)}
          disabled={!selected}
          className={[
            "w-full py-2.5 rounded-md text-sm font-semibold transition-all duration-200",
            selected
              ? `${meta.bgClass} ${meta.textClass} border ${meta.borderClass} hover:opacity-80`
              : "bg-subtle border border-border text-muted cursor-not-allowed opacity-50",
          ].join(" ")}
        >
          {selected ? ACTION_BUTTON[userRole] : "Select a target"}
        </button>
      </div>
    </div>
  );
}
