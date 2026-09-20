"use client";

import { MoonIcon, SunIcon } from "@/icons";
import type { DaySubphase } from "@/lib/types";

interface Props {
  phase: "NIGHT" | "DAY";
  subphase?: DaySubphase;
  round: number;
  timeLeft: number;
  totalTime: number;
}

export function PhaseHeader({ phase, subphase, round, timeLeft, totalTime }: Props) {
  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isUrgent = timeLeft <= 15;
  const isNight = phase === "NIGHT";

  const phaseColor = isNight ? "text-detective" : "text-gold";
  const progressColor = isUrgent ? "bg-danger" : isNight ? "bg-detective" : "bg-gold";

  const minutes = Math.floor(Math.max(0, timeLeft) / 60);
  const seconds = Math.max(0, timeLeft) % 60;
  const timerStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="flex-shrink-0 bg-surface border-b border-border">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3">
          <span className={phaseColor}>{isNight ? <MoonIcon size={18} /> : <SunIcon size={18} />}</span>
          <div className="flex items-center gap-2">
            <span className={`font-display font-semibold tracking-widest text-sm ${phaseColor}`}>{phase}</span>
            {subphase && (
              <>
                <span className="text-border-bright">—</span>
                <span className="text-xs font-mono text-muted tracking-wider">{subphase}</span>
              </>
            )}
          </div>
        </div>

        <div className="text-xs font-mono text-muted tracking-wider">ROUND {round}</div>

        <div
          className={`font-mono text-xl font-bold tabular-nums ${isUrgent ? "text-danger animate-timer-pulse" : phaseColor}`}
        >
          {timerStr}
        </div>
      </div>

      <div className="h-0.5 bg-border">
        <div className={`h-full ${progressColor} transition-all duration-1000`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
