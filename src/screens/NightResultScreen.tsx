"use client";

import { LockIcon, SkullIcon } from "@/icons";
import type { Role } from "@/lib/types";
import { ROLE_META } from "@/lib/types";

interface Props {
  userRole: Role;
  victimName: string | null;
  victimRole?: Role;
  investigationTarget?: string;
  investigationResult?: boolean;
  winner?: "MAFIA" | "VILLAGER" | null;
  onContinue: () => void;
}

export function NightResultScreen({
  userRole,
  victimName,
  victimRole,
  investigationTarget,
  investigationResult,
  winner,
  onContinue,
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 max-w-xl w-full px-8 animate-fade-in">
        <div className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="border-b border-border px-6 py-4 bg-surface">
            <p className="text-xs font-mono text-muted tracking-[0.3em] text-center">DAWN HAS BROKEN</p>
          </div>

          <div className="px-8 py-8 text-center">
            {victimName ? (
              <>
                <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center mx-auto mb-5">
                  <SkullIcon size={28} className="text-danger" />
                </div>
                <h2 className="font-display text-2xl font-bold text-text mb-2">
                  <span className="italic">{victimName}</span> was found dead.
                </h2>
                {victimRole && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="text-sm text-muted">They were the</span>
                    <span className={`text-sm font-semibold font-mono px-2 py-0.5 rounded ${ROLE_META[victimRole].badgeClass}`}>
                      {victimRole}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-doctor/10 border border-doctor/30 flex items-center justify-center mx-auto mb-5">
                  <span className="text-3xl">🌅</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-text mb-2">No one died last night.</h2>
                <p className="text-sm text-muted mt-2">The Doctor&apos;s protection held through the night.</p>
              </>
            )}
          </div>
        </div>

        {userRole === "Detective" && investigationTarget && (
          <div
            className="w-full bg-detective/5 border border-detective/20 rounded-xl overflow-hidden animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="px-4 py-2.5 border-b border-detective/20 bg-detective/10 flex items-center gap-2">
              <LockIcon size={12} className="text-detective" />
              <span className="text-xs font-mono text-detective tracking-wider">PRIVATE INTEL — ONLY YOU CAN SEE THIS</span>
            </div>
            <div className="px-6 py-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-detective/20 border border-detective/30 flex items-center justify-center text-xs font-mono font-semibold text-detective flex-shrink-0">
                {investigationTarget.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-text">
                  You investigated <span className="font-semibold">{investigationTarget}</span>
                </p>
                <p className="text-sm mt-0.5">
                  Result:{" "}
                  <span className={investigationResult ? "text-mafia font-semibold" : "text-doctor font-semibold"}>
                    {investigationResult ? "⚠ Mafia" : "✓ Not Mafia"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="px-10 py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/20 transition-all duration-200"
        >
          Proceed to {winner ? "Results" : "Day Phase"} →
        </button>
      </div>
    </div>
  );
}
