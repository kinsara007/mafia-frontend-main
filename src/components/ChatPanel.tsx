"use client";

import { useState, useRef, useEffect } from "react";
import { SendIcon } from "@/icons";
import type { ChatMessage } from "@/lib/types";

interface Props {
  messages: ChatMessage[];
  disabled?: boolean;
  onSend?: (text: string) => void;
  currentUserId: string;
}

export function ChatPanel({ messages, disabled, onSend, currentUserId }: Props) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || disabled) return;
    onSend?.(text);
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-mono text-muted tracking-wider">DISCUSSION</span>
        <span className="text-xs text-muted">{messages.length} messages</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-muted text-center py-10 font-mono">No messages yet. Accuse wisely.</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.playerId === currentUserId;
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-mono font-semibold text-white ${
                  isMe ? "bg-gold/70" : "bg-subtle border border-border-bright"
                }`}
              >
                {msg.playerName.slice(0, 2).toUpperCase()}
              </div>
              <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                {!isMe && <span className="text-[10px] text-muted pl-1">{msg.playerName}</span>}
                <div
                  className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    isMe
                      ? "bg-gold/10 border border-gold/20 text-text rounded-tr-sm"
                      : "bg-surface border border-border text-text rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-subtle px-1">{msg.time}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 border-t border-border p-3">
        {disabled ? (
          <div className="text-center text-xs text-muted py-2 font-mono">
            {disabled === true ? "You cannot speak right now" : "Dead players cannot speak"}
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Say something…"
              className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-text placeholder-subtle focus:outline-none focus:border-gold/40 focus:bg-card-hover transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 flex items-center justify-center rounded-md bg-gold/10 border border-gold/20 text-gold hover:bg-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <SendIcon size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
