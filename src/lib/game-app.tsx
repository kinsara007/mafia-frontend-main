"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { clearRoom, clearSession, getStoredRoom, getStoredToken, getStoredUser, persistRoom, persistSession } from "@/lib/storage";
import {
  ACTION_FOR_ROLE,
  PHASE_SECONDS,
  ROLE_FROM_BACKEND,
  parseWinner,
  type AuthUser,
  type BackendPhase,
  type BackendRole,
  type ChatMessage,
  type ConnectionStatus,
  type GameState,
  type Player,
  type Role,
  type Screen,
  type VoteEntry,
} from "@/lib/types";
import { AuthScreen } from "@/screens/AuthScreen";
import { HomeScreen } from "@/screens/HomeScreen";
import { LobbyScreen } from "@/screens/LobbyScreen";
import { RoleRevealScreen } from "@/screens/RoleRevealScreen";
import { NightPhaseScreen } from "@/screens/NightPhaseScreen";
import { NightResultScreen } from "@/screens/NightResultScreen";
import { DayPhaseScreen } from "@/screens/DayPhaseScreen";
import { DayResultScreen } from "@/screens/DayResultScreen";
import { GameOverScreen } from "@/screens/GameOverScreen";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function asPlayer(
  userId: number,
  name: string,
  opts: { isHost?: boolean; isAlive?: boolean; role?: Role; roleKnown?: boolean },
): Player {
  return {
    id: String(userId),
    userId: Number.isFinite(userId) ? userId : -1,
    name,
    initials: initials(name),
    role: opts.role ?? "Villager",
    isAlive: opts.isAlive ?? true,
    isHost: opts.isHost ?? false,
    roleKnown: opts.roleKnown ?? false,
  };
}

function parseRole(raw: unknown): Role | undefined {
  if (typeof raw !== "string") return undefined;
  const key = raw.toUpperCase() as BackendRole;
  return ROLE_FROM_BACKEND[key];
}

export function GameApp() {
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [screen, setScreen] = useState<Screen>("auth");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myRole, setMyRole] = useState<Role>("Villager");
  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<BackendPhase | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [submittedTarget, setSubmittedTarget] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [votes, setVotes] = useState<VoteEntry[]>([]);
  const [myVote, setMyVote] = useState<string | undefined>();
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(40);
  const [nightVictim, setNightVictim] = useState<{ name: string | null; role?: Role }>({ name: null });
  const [investigation, setInvestigation] = useState<{ name: string; isMafia: boolean } | null>(null);
  const [dayResult, setDayResult] = useState<{
    name: string | null;
    role?: Role;
    message?: string;
  }>({ name: null });
  const [winner, setWinner] = useState<"MAFIA" | "VILLAGER" | null>(null);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [roleRevealed, setRoleRevealed] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const pollTimer = useRef<number | null>(null);
  const tokenRef = useRef<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const playersRef = useRef<Player[]>([]);
  const authUserRef = useRef<AuthUser | null>(null);
  const screenRef = useRef<Screen>("auth");
  const roleRevealedRef = useRef(false);
  const phaseRef = useRef<BackendPhase | null>(null);
  const hostIdRef = useRef<number | null>(null);
  const intendedCloseRef = useRef(false);
  const socketGenRef = useRef(0);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);
  useEffect(() => {
    roomCodeRef.current = roomCode;
  }, [roomCode]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    roleRevealedRef.current = roleRevealed;
  }, [roleRevealed]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    hostIdRef.current = hostId;
  }, [hostId]);

  const mePlayer: Player | null = useMemo(() => {
    if (!authUser) return null;
    const existing = players.find((p) => p.userId === authUser.id);
    if (existing) return existing;
    return asPlayer(authUser.id, authUser.name, { isHost: hostId === authUser.id });
  }, [authUser, players, hostId]);

  const resetRoom = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    setRoomCode(null);
    setRoomId(null);
    setHostId(null);
    setPlayers([]);
    setMyRole("Villager");
    setRound(1);
    setPhase(null);
    setGameId(null);
    setActionSubmitted(false);
    setSubmittedTarget(undefined);
    setMessages([]);
    setVotes([]);
    setMyVote(undefined);
    setWinner(null);
    setRoleRevealed(false);
    setConnectionStatus("disconnected");
    setLobbyError(null);
    clearRoom();
    setScreen("home");
  }, []);

  const startPhaseTimer = useCallback((nextPhase: BackendPhase, durationSeconds?: number) => {
    const seconds = durationSeconds ?? PHASE_SECONDS[nextPhase] ?? 30;
    setTotalTime(seconds);
    setTimeLeft(seconds);
  }, []);

  const applyVote = useCallback((voterId: string, targetId: string) => {
    setVotes((prev) => {
      const withoutVoter = prev
        .map((v) => ({ ...v, voterIds: v.voterIds.filter((id) => id !== voterId) }))
        .filter((v) => v.voterIds.length > 0);
      const existing = withoutVoter.find((v) => v.targetId === targetId);
      if (existing) {
        return withoutVoter.map((v) =>
          v.targetId === targetId ? { ...v, voterIds: [...v.voterIds, voterId] } : v,
        );
      }
      return [...withoutVoter, { targetId, voterIds: [voterId] }];
    });
  }, []);

  const applyGameState = useCallback(
    (state: Record<string, unknown> | GameState, opts?: { skipScreen?: boolean }) => {
      if (state.status === "LOBBY") {
        if (typeof state.host_id === "number") setHostId(state.host_id);
        return;
      }

      if (typeof state.game_id === "string") setGameId(state.game_id);
      if (typeof state.round_number === "number") setRound(state.round_number);
      if (typeof state.phase === "string") setPhase(state.phase as BackendPhase);
      const role = parseRole(state.my_role);
      if (role) setMyRole(role);
      if (typeof state.my_is_alive === "boolean") {
        const you = authUserRef.current;
        if (you) {
          setPlayers((prev) =>
            prev.map((p) => (p.userId === you.id ? { ...p, isAlive: state.my_is_alive as boolean } : p)),
          );
        }
      }

      const host = hostIdRef.current;
      const you = authUserRef.current;
      const incoming = Array.isArray(state.players) ? state.players : [];
      if (incoming.length > 0 && typeof incoming[0] === "object") {
        setPlayers(
          incoming.map((raw) => {
            const row = raw as {
              user_id: number;
              name?: string;
              is_alive: boolean;
              role?: string | null;
            };
            const prev = playersRef.current.find((p) => p.userId === row.user_id);
            const parsed = parseRole(row.role);
            const mappedRole =
              you && row.user_id === you.id
                ? (role ?? prev?.role ?? "Villager")
                : parsed ?? prev?.role ?? "Villager";
            return asPlayer(row.user_id, row.name ?? prev?.name ?? `Player ${row.user_id}`, {
              isAlive: row.is_alive,
              isHost: host === row.user_id,
              role: mappedRole,
              roleKnown: Boolean(parsed) || (you != null && row.user_id === you.id),
            });
          }),
        );
      }

      if (state.my_action_submitted === true) setActionSubmitted(true);
      const parsedWinner = parseWinner(state.winner);
      if (parsedWinner) setWinner(parsedWinner);

      if (opts?.skipScreen) return;

      const current = screenRef.current;
      if (state.status === "COMPLETED" || state.phase === "ENDED") {
        if (current !== "game-over" && current !== "night-result" && current !== "day-result") {
          setScreen("game-over");
        }
        return;
      }

      if (!roleRevealedRef.current) {
        setScreen("role-reveal");
        return;
      }

      if (state.phase === "VOTING" && current === "day-phase" && phaseRef.current !== "VOTING") {
        setMyVote(undefined);
        setVotes([]);
        startPhaseTimer("VOTING");
        return;
      }

      if (state.phase === "NIGHT" && current !== "night-phase" && current !== "role-reveal" && current !== "day-result") {
        setActionSubmitted(false);
        setSubmittedTarget(undefined);
        startPhaseTimer("NIGHT");
        setScreen("night-phase");
      } else if (state.phase === "DAY_DISCUSSION" && current !== "night-result" && current !== "day-phase") {
        startPhaseTimer("DAY_DISCUSSION");
        setScreen("day-phase");
      } else if (state.phase === "VOTING" && current !== "day-result" && current !== "day-phase") {
        setMyVote(undefined);
        setVotes([]);
        startPhaseTimer("VOTING");
        setScreen("day-phase");
      }
    },
    [startPhaseTimer],
  );

  const applyLobbySnapshot = useCallback(
    (data: Record<string, unknown>) => {
      if (typeof data.room_id === "string") setRoomId(data.room_id);
      if (typeof data.host_id === "number") setHostId(data.host_id);
      const incoming = Array.isArray(data.players) ? data.players : null;
      if (!incoming) return;
      const host = typeof data.host_id === "number" ? data.host_id : hostIdRef.current;
      setPlayers(
        incoming
          .map((raw) => {
            if (typeof raw === "number") {
              const prev = playersRef.current.find((p) => p.userId === raw);
              return asPlayer(raw, prev?.name ?? `Player ${raw}`, {
                isHost: host === raw,
                role: prev?.role ?? "Villager",
                isAlive: prev?.isAlive ?? true,
                roleKnown: prev?.roleKnown,
              });
            }
            const row = raw as { id?: number; user_id?: number; name?: string };
            const userId = Number(row.id ?? row.user_id);
            if (!Number.isFinite(userId)) return null;
            const prev = playersRef.current.find((p) => p.userId === userId);
            return asPlayer(userId, row.name ?? prev?.name ?? `Player ${userId}`, {
              isHost: host === userId,
              role: prev?.role ?? "Villager",
              isAlive: prev?.isAlive ?? true,
              roleKnown: prev?.roleKnown,
            });
          })
          .filter((p): p is Player => p !== null),
      );
      if (data.room_status === "IN_PROGRESS") {
        const t = tokenRef.current;
        const code = roomCodeRef.current;
        if (t && code && screenRef.current === "lobby") {
          void api.getGameState(t, code).then((state) => applyGameState(state));
        }
      }
    },
    [applyGameState],
  );

  const refreshRoomDetails = useCallback(async () => {
    const t = tokenRef.current;
    const code = roomCodeRef.current;
    if (!t || !code) return;
    try {
      const details = await api.getRoomDetails(t, code);
      applyLobbySnapshot(details as unknown as Record<string, unknown>);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403 || err.status === 404)) {
        if (err.status === 401) {
          clearSession();
          setToken(null);
          setAuthUser(null);
          setScreen("auth");
        } else {
          resetRoom();
        }
      }
    }
  }, [applyGameState, applyLobbySnapshot]);

  const connectSocket = useCallback((nextRoomId: string, nextToken: string) => {
    const existing = wsRef.current;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    intendedCloseRef.current = false;
    setConnectionStatus("reconnecting");
    const generation = ++socketGenRef.current;
    const socket = new WebSocket(`${WS_URL}/ws/room/${nextRoomId}?token=${encodeURIComponent(nextToken)}`);
    wsRef.current = socket;

    socket.onopen = () => {
      if (socketGenRef.current !== generation) return;
      setConnectionStatus("connected");
    };
    socket.onerror = () => {
      if (socketGenRef.current !== generation) return;
      setConnectionStatus("disconnected");
    };
    socket.onclose = (ev) => {
      if (wsRef.current === socket) wsRef.current = null;
      if (socketGenRef.current !== generation) return;
      setConnectionStatus("disconnected");
      if (intendedCloseRef.current) return;
      if (ev.code === 1008) return;
      if (!roomIdRef.current || !tokenRef.current) return;
      reconnectTimer.current = window.setTimeout(() => {
        if (roomIdRef.current && tokenRef.current && !intendedCloseRef.current) {
          connectSocket(roomIdRef.current, tokenRef.current);
        }
      }, 2500);
    };
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          event?: string;
          data?: Record<string, unknown>;
          user_id?: number;
          message?: string;
        };
        const eventName = payload.event ?? "";
        const data = payload.data ?? {};

        if (eventName === "lobby_updated" || eventName === "player_joined" || eventName === "player_left") {
          if (screenRef.current === "lobby") {
            applyLobbySnapshot(data);
          }
        } else if (eventName === "room_closed") {
          resetRoom();
        } else if (eventName === "game_started") {
          if (typeof data.game_id === "string") setGameId(data.game_id);
          const duration = typeof data.duration_seconds === "number" ? data.duration_seconds : undefined;
          startPhaseTimer("NIGHT", duration);
          const t = tokenRef.current;
          const code = roomCodeRef.current;
          if (t && code) {
            void api.getGameState(t, code).then((state) => applyGameState(state));
          }
        } else if (eventName === "voting_started") {
          setPhase("VOTING");
          setMyVote(undefined);
          setVotes([]);
          setActionSubmitted(false);
          const duration = typeof data.duration_seconds === "number" ? data.duration_seconds : undefined;
          startPhaseTimer("VOTING", duration);
          setScreen("day-phase");
        } else if (eventName === "night_resolved") {
          const killedId = data.killed_player_id as number | null;
          const killedRole = parseRole(data.killed_player_role);
          const victim = killedId ? playersRef.current.find((p) => p.userId === killedId) : undefined;
          setNightVictim({
            name: victim?.name ?? (killedId ? `Player ${killedId}` : null),
            role: killedRole,
          });
          if (data.detective_result && typeof data.detective_result === "object") {
            const det = data.detective_result as { target_id: number; is_mafia: boolean };
            const target = playersRef.current.find((p) => p.userId === det.target_id);
            setInvestigation({
              name: target?.name ?? `Player ${det.target_id}`,
              isMafia: det.is_mafia,
            });
          } else {
            setInvestigation(null);
          }
          if (typeof data.round_number === "number") setRound(data.round_number);
          if (typeof data.phase === "string") setPhase(data.phase as BackendPhase);
          const nightWinner = parseWinner(data.winner);
          if (nightWinner) setWinner(nightWinner);
          const duration = typeof data.duration_seconds === "number" ? data.duration_seconds : undefined;
          startPhaseTimer("DAY_DISCUSSION", duration);
          const t = tokenRef.current;
          const code = roomCodeRef.current;
          if (t && code) {
            void api.getGameState(t, code).then((state) => applyGameState(state, { skipScreen: true }));
          }
          setScreen("night-result");
        } else if (eventName === "morning_resolved") {
          const eliminatedId = data.eliminated_player_id as number | null;
          const eliminatedRole = parseRole(data.eliminated_player_role);
          const eliminated = eliminatedId
            ? playersRef.current.find((p) => p.userId === eliminatedId)
            : undefined;
          setDayResult({
            name: eliminated?.name ?? (eliminatedId ? `Player ${eliminatedId}` : null),
            role: eliminatedRole,
            message: typeof data.message === "string" ? data.message : undefined,
          });
          const morningWinner = parseWinner(data.winner);
          if (morningWinner) setWinner(morningWinner);
          const t = tokenRef.current;
          const code = roomCodeRef.current;
          if (t && code) {
            void api.getGameState(t, code).then((state) => applyGameState(state, { skipScreen: true }));
          }
          setScreen("day-result");
        } else if (eventName === "chat_message") {
          const userId = data.user_id as number;
          const text = String(data.text ?? "");
          const speaker = playersRef.current.find((p) => p.userId === userId);
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${userId}`,
              playerId: String(userId),
              playerName: speaker?.name ?? `Player ${userId}`,
              text,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } else if (eventName === "action_confirmed" || eventName === "vote_confirmed" || eventName === "voting successfull") {
          setActionSubmitted(true);
        } else if (eventName === "vote_cast") {
          const voterId = String(data.voter_id ?? "");
          const targetId = String(data.target_id ?? "");
          if (voterId && targetId) applyVote(voterId, targetId);
        } else if (eventName === "error") {
          setLobbyError(payload.message ?? "Something went wrong");
        }
      } catch {
        // ignore malformed frames
      }
    };
  }, [applyGameState, applyLobbySnapshot, applyVote, resetRoom, startPhaseTimer]);

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();
    const storedRoom = getStoredRoom();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setAuthUser(storedUser);
      if (storedRoom) {
        setRoomCode(storedRoom.roomCode);
        setRoomId(storedRoom.roomId);
        setScreen("lobby");
      } else {
        setScreen("home");
      }
    }
    setHydrated(true);
  }, []);

  const connectSocketRef = useRef(connectSocket);
  connectSocketRef.current = connectSocket;

  useEffect(() => {
    if (!roomId || !token) return;
    intendedCloseRef.current = false;
    connectSocketRef.current(roomId, token);
    return () => {
      intendedCloseRef.current = true;
      socketGenRef.current += 1;
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      const socket = wsRef.current;
      wsRef.current = null;
      socket?.close();
    };
  }, [roomId, token]);

  useEffect(() => {
    if (!roomCode || !token) return;
    void refreshRoomDetails();
    return () => {
      if (pollTimer.current) {
        window.clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
  }, [roomCode, token, refreshRoomDetails]);

  useEffect(() => {
    if (screen !== "night-phase" && screen !== "day-phase") return;
    const id = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [screen, phase]);

  const sendWs = (body: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(body));
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const res = await api.login(email, password);
    persistSession(res.access_token, res.user);
    setToken(res.access_token);
    setAuthUser(res.user);
    setScreen("home");
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    await api.register(name, email, password);
    await handleLogin(email, password);
  };

  const handleLogout = () => {
    clearSession();
    resetRoom();
    setToken(null);
    setAuthUser(null);
    setScreen("auth");
  };

  const handleCreateRoom = async () => {
    if (!token) return;
    const res = await api.createRoom(token);
    persistRoom({ roomCode: res.room_code, roomId: res.room_id });
    setRoomCode(res.room_code);
    setRoomId(res.room_id);
    setHostId(authUser?.id ?? null);
    setScreen("lobby");
  };

  const handleJoinRoom = async (code: string) => {
    if (!token) return;
    const res = await api.joinRoom(token, code);
    persistRoom({ roomCode: code, roomId: res.room_id });
    setRoomCode(code);
    setRoomId(res.room_id);
    setScreen("lobby");
  };

  const handleStartGame = async () => {
    if (!token || !roomCode) return;
    setStarting(true);
    setLobbyError(null);
    try {
      await api.startGame(token, roomCode);
    } catch (err) {
      setLobbyError(err instanceof Error ? err.message : "Could not start game");
    } finally {
      setStarting(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (token && roomCode) {
      try {
        await api.leaveRoom(token, roomCode);
      } catch {
        // still leave locally
      }
    }
    resetRoom();
  };

  const handleNightAction = (targetId: string) => {
    const action = ACTION_FOR_ROLE[myRole];
    if (!action) return;
    setSubmittedTarget(targetId);
    setActionSubmitted(true);
    sendWs({
      event: "night_action",
      payload: { target_id: Number(targetId), action_type: action },
    });
  };

  const handleVote = (playerId: string) => {
    if (myVote) return;
    setMyVote(playerId);
    applyVote(String(authUser?.id), playerId);
    sendWs({
      event: "voting",
      payload: { target_id: Number(playerId), action_type: "VOTE" },
    });
  };

  const handleChat = (text: string) => {
    sendWs({
      event: "day_discussion",
      payload: { message: text },
    });
  };

  if (!hydrated) {
    return <div className="min-h-screen bg-bg" />;
  }

  if (!authUser || !token || screen === "auth" || !mePlayer) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (screen === "home") {
    return (
      <HomeScreen
        user={mePlayer}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "lobby" && roomCode) {
    return (
      <LobbyScreen
        user={mePlayer}
        roomCode={roomCode}
        players={players}
        connectionStatus={connectionStatus}
        starting={starting}
        error={lobbyError}
        onStartGame={handleStartGame}
        onLeave={handleLeaveRoom}
      />
    );
  }

  if (screen === "role-reveal") {
    return (
      <RoleRevealScreen
        role={myRole}
        onContinue={() => {
          setRoleRevealed(true);
          startPhaseTimer("NIGHT");
          setScreen("night-phase");
        }}
      />
    );
  }

  if (screen === "night-phase") {
    return (
      <NightPhaseScreen
        user={mePlayer}
        userRole={myRole}
        players={players}
        round={round}
        timeLeft={timeLeft}
        totalTime={totalTime}
        connectionStatus={connectionStatus}
        submitted={actionSubmitted}
        submittedTarget={submittedTarget}
        onSubmit={handleNightAction}
      />
    );
  }

  if (screen === "night-result") {
    return (
      <NightResultScreen
        userRole={myRole}
        victimName={nightVictim.name}
        victimRole={nightVictim.role}
        investigationTarget={investigation?.name}
        investigationResult={investigation?.isMafia}
        winner={winner}
        onContinue={() => {
          if (winner) {
            setScreen("game-over");
            return;
          }
          setMessages([]);
          startPhaseTimer("DAY_DISCUSSION");
          setPhase("DAY_DISCUSSION");
          setScreen("day-phase");
        }}
      />
    );
  }

  if (screen === "day-phase") {
    return (
      <DayPhaseScreen
        user={mePlayer}
        players={players}
        messages={messages}
        votes={votes}
        myVote={myVote}
        subphase={phase === "VOTING" ? "VOTING" : "DISCUSSION"}
        round={round}
        timeLeft={timeLeft}
        totalTime={totalTime}
        connectionStatus={connectionStatus}
        chatEnabled={mePlayer.isAlive && phase === "DAY_DISCUSSION"}
        onSend={handleChat}
        onVote={handleVote}
      />
    );
  }

  if (screen === "day-result") {
    return (
      <DayResultScreen
        eliminatedName={dayResult.name}
        eliminatedRole={dayResult.role}
        tieMessage={dayResult.message}
        onContinue={() => {
          if (winner) {
            setScreen("game-over");
            return;
          }
          if (!dayResult.name) {
            setMyVote(undefined);
            setVotes([]);
            startPhaseTimer("VOTING");
            setPhase("VOTING");
            setScreen("day-phase");
            return;
          }
          setActionSubmitted(false);
          setSubmittedTarget(undefined);
          setMyVote(undefined);
          setVotes([]);
          startPhaseTimer("NIGHT");
          setPhase("NIGHT");
          setScreen("night-phase");
        }}
      />
    );
  }

  if (screen === "game-over") {
    return (
      <GameOverScreen
        winner={winner ?? "VILLAGER"}
        players={players}
        currentUserId={mePlayer.id}
        onLeave={resetRoom}
      />
    );
  }

  return (
    <HomeScreen
      user={mePlayer}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onLogout={handleLogout}
    />
  );
}
