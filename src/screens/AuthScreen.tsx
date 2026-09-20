"use client";

import { useState } from "react";

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}

export function AuthScreen({ onLogin, onRegister }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (tab === "register" && !name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (tab === "register" && password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (tab === "login") await onLogin(email.trim(), password);
      else await onRegister(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-bg"
      style={{ backgroundImage: "radial-gradient(ellipse at 50% 30%, rgba(61,142,248,0.04) 0%, transparent 60%)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-gold tracking-widest mb-1">MAFIA</h1>
          <p className="text-xs font-mono text-muted tracking-[0.25em]">REAL-TIME PARTY GAME</p>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
          <div className="flex border-b border-border">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError("");
                }}
                className={[
                  "flex-1 py-3.5 text-sm font-medium transition-colors",
                  tab === t ? "text-gold border-b-2 border-gold bg-gold/5" : "text-muted hover:text-text",
                ].join(" ")}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {tab === "register" && (
              <div className="animate-fade-in">
                <label className="block text-xs font-mono text-muted mb-1.5 tracking-wider">NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder-subtle focus:outline-none focus:border-gold/40 focus:bg-bg transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-muted mb-1.5 tracking-wider">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder-subtle focus:outline-none focus:border-gold/40 focus:bg-bg transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted mb-1.5 tracking-wider">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder-subtle focus:outline-none focus:border-gold/40 focus:bg-bg transition-colors"
              />
            </div>

            {tab === "register" && (
              <div className="animate-fade-in">
                <label className="block text-xs font-mono text-muted mb-1.5 tracking-wider">CONFIRM PASSWORD</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text placeholder-subtle focus:outline-none focus:border-gold/40 focus:bg-bg transition-colors"
                />
              </div>
            )}

            {error && <p className="text-xs text-danger font-mono animate-fade-in">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-lg bg-gold/10 border border-gold/30 text-gold font-semibold text-sm hover:bg-gold/20 transition-all duration-200 mt-2 disabled:opacity-50"
            >
              {busy ? "Please wait…" : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted/50 mt-6">No payment required · Play for free</p>
      </div>
    </div>
  );
}
