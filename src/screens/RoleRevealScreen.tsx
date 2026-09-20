"use client";

import { useState, useEffect } from "react";
import { ROLE_META, type Role } from "@/lib/types";

interface Props {
  role: Role;
  onContinue: () => void;
}

export function RoleRevealScreen({ role, onContinue }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const meta = ROLE_META[role];

  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(true), 600);
    const t2 = setTimeout(() => setCanContinue(true), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(ellipse at 50% 40%, ${meta.color}15 0%, transparent 60%)`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 80%, rgba(61,142,248,0.06) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(201,168,92,0.04) 0%, transparent 40%)",
        }}
      />

      <div
        className={`relative z-10 flex flex-col items-center text-center px-8 transition-all duration-700 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        <p className="text-xs font-mono text-muted tracking-[0.4em] mb-8">YOUR ROLE HAS BEEN ASSIGNED</p>

        <div
          className={["w-72 rounded-2xl border p-10 flex flex-col items-center gap-4 mb-8 shadow-2xl", "animate-card-flip", meta.bgClass, meta.borderClass].join(
            " ",
          )}
          style={{ boxShadow: `0 0 60px ${meta.color}20, 0 0 120px ${meta.color}08` }}
        >
          <div
            className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-4xl"
            style={{ borderColor: meta.color, background: `${meta.color}15` }}
          >
            {meta.icon}
          </div>

          <div>
            <p className="text-xs font-mono text-muted tracking-widest mb-1">YOU ARE</p>
            <h1 className="font-display text-5xl font-bold italic" style={{ color: meta.color }}>
              {meta.label}
            </h1>
          </div>

          <p className="text-sm text-muted leading-relaxed text-center max-w-52">{meta.description}</p>
        </div>

        <button
          onClick={canContinue ? onContinue : undefined}
          disabled={!canContinue}
          className={[
            "px-10 py-3 rounded-xl font-semibold text-sm transition-all duration-500",
            canContinue
              ? `text-text border cursor-pointer hover:opacity-80 ${meta.bgClass} ${meta.borderClass}`
              : "border border-border text-muted/30 cursor-not-allowed",
          ].join(" ")}
        >
          {canContinue ? "I Understand My Role →" : "Read your role carefully…"}
        </button>
      </div>
    </div>
  );
}
