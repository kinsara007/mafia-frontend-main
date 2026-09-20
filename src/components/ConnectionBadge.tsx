"use client";

import type { ConnectionStatus } from "@/lib/types";
import { WifiOffIcon } from "@/icons";

interface Props {
  status: ConnectionStatus;
}

export function ConnectionBadge({ status }: Props) {
  if (status === "connected") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <span className="w-1.5 h-1.5 rounded-full bg-doctor" />
        Connected
      </div>
    );
  }
  if (status === "reconnecting") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-warning animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-warning" />
        Reconnecting…
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-xs text-danger">
      <WifiOffIcon size={12} />
      Disconnected
    </div>
  );
}
