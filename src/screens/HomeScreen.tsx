"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import type { Player } from "@/lib/types";

interface Props {
  user: Player;
  onCreateRoom: () => Promise<void>;
  onJoinRoom: (code: string) => Promise<void>;
  onLogout: () => void;
}

export function HomeScreen({ user, onCreateRoom, onJoinRoom, onLogout }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      setError("Enter a room code");
      return;
    }
    if (cleaned.length < 4) {
      setError("Invalid code");
      return;
    }
    setBusy("join");
    try {
      await onJoinRoom(cleaned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join room");
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async () => {
    setBusy("create");
    setError("");
    try {
      await onCreateRoom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create room");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-bg"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 60% 20%, rgba(201,168,92,0.03) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(61,142,248,0.04) 0%, transparent 50%)",
      }}
    >
      <NavBar user={user} onLeave={onLogout} leaveLabel="Sign out" />

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-semibold text-text mb-2">
              Welcome back, <span className="text-gold italic">{user.name}</span>
            </h2>
            <p className="text-muted text-sm">Create a new room or join a friend&apos;s game.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center text-center hover:border-gold/30 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-5 group-hover:bg-gold/15 transition-colors">
                <span className="text-2xl">🎭</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-text mb-2">Create Room</h3>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Start a new game. You&apos;ll get a shareable code to send to your friends.
              </p>
              <button
                onClick={handleCreate}
                disabled={busy !== null}
                className="w-full py-3 rounded-lg bg-gold/10 border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/20 transition-all duration-200 animate-pulse-glow disabled:opacity-50"
              >
                {busy === "create" ? "Creating…" : "Create Room"}
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center text-center hover:border-detective/30 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-detective/10 border border-detective/20 flex items-center justify-center mb-5 group-hover:bg-detective/15 transition-colors">
                <span className="text-2xl">🚪</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-text mb-2">Join Room</h3>
              <p className="text-sm text-muted mb-6 leading-relaxed">
                Enter the room code your host shared to jump into their game.
              </p>
              <form onSubmit={handleJoin} className="w-full space-y-3">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="ABC123"
                  maxLength={12}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-text text-center placeholder-subtle focus:outline-none focus:border-detective/40 focus:bg-bg tracking-widest uppercase transition-colors"
                />
                {error && <p className="text-xs text-danger font-mono">{error}</p>}
                <button
                  type="submit"
                  disabled={busy !== null}
                  className="w-full py-3 rounded-lg bg-detective/10 border border-detective/30 text-detective font-semibold text-sm hover:bg-detective/20 transition-all duration-200 disabled:opacity-50"
                >
                  {busy === "join" ? "Joining…" : "Join Game"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
