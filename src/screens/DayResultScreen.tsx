"use client";

import { ROLE_META, type Role } from "@/lib/types";

interface Props {
  eliminatedName: string | null;
  eliminatedRole?: Role;
  tieMessage?: string | null;
  onContinue: () => void;
}

export function DayResultScreen({ eliminatedName, eliminatedRole, tieMessage, onContinue }: Props) {
  const roleMeta = eliminatedRole ? ROLE_META[eliminatedRole] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 max-w-xl w-full px-8 animate-fade-in">
        <div className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="border-b border-border px-6 py-4 bg-surface">
            <p className="text-xs font-mono text-muted tracking-[0.3em] text-center">THE TOWN HAS VOTED</p>
          </div>

          <div className="px-8 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center mx-auto mb-5">
              <span className="text-3xl">⚖️</span>
            </div>
            {eliminatedName ? (
              <>
                <h2 className="font-display text-2xl font-bold text-text mb-3">
                  <span className="italic">{eliminatedName}</span> was voted out.
                </h2>
                {roleMeta && (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-muted">They were the</span>
                    <span className={`text-sm font-semibold font-mono px-2 py-0.5 rounded ${roleMeta.badgeClass}`}>
                      {eliminatedRole}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-text mb-3">The vote was a tie.</h2>
                <p className="text-sm text-muted">{tieMessage ?? "No player was eliminated. Vote again."}</p>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onContinue}
          className="px-10 py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/20 transition-all duration-200"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
