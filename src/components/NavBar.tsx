"use client";

import { ConnectionBadge } from "./ConnectionBadge";
import type { ConnectionStatus, Player } from "@/lib/types";

interface Props {
  user: Player;
  connectionStatus?: ConnectionStatus;
  onLeave?: () => void;
  leaveLabel?: string;
}

export function NavBar({
  user,
  connectionStatus = "connected",
  onLeave,
  leaveLabel = "Leave Room",
}: Props) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-semibold tracking-wide text-gold">MAFIA</span>
        <span className="text-border-bright text-sm">|</span>
        <ConnectionBadge status={connectionStatus} />
      </div>
      <div className="flex items-center gap-4">
        {onLeave && (
          <button
            onClick={onLeave}
            className="text-xs text-muted hover:text-danger transition-colors"
          >
            {leaveLabel}
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-subtle border border-border-bright flex items-center justify-center text-xs font-semibold font-mono text-text">
            {user.initials}
          </div>
          <span className="text-sm text-text">{user.name}</span>
        </div>
      </div>
    </header>
  );
}
