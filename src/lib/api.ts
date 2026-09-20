const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

import type { BackendAction, GameState } from "./types";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
}

export interface RoomDetails {
  room_id: string;
  host_id: number;
  room_status: "WAITING" | "IN_PROGRESS" | "FINISHED";
  players: AuthUserResponse[];
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(", ");
    }
    return JSON.stringify(data);
  } catch {
    return res.statusText || "Request failed";
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { access_token: token } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    request<AuthUserResponse>("/user/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{
      access_token: string;
      user: AuthUserResponse;
    }>("/user/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  createRoom: (token: string) =>
    request<{ room_code: string; room_id: string }>("/room/create", {
      method: "POST",
      token,
    }),

  joinRoom: (token: string, roomCode: string) =>
    request<{ msg: string; room_id: string; room_players: unknown[] }>(
      `/room/${encodeURIComponent(roomCode)}/join`,
      { method: "POST", token },
    ),

  getRoomDetails: (token: string, roomCode: string) =>
    request<RoomDetails>(`/room/${encodeURIComponent(roomCode)}`, { token }),

  leaveRoom: (token: string, roomCode: string) =>
    request<{ message: string }>(`/room/${encodeURIComponent(roomCode)}/leave`, {
      method: "POST",
      token,
    }),

  startGame: (token: string, roomCode: string) =>
    request<{ msg: string; game_id: string; room_id: string }>(
      `/game/${encodeURIComponent(roomCode)}/start`,
      { method: "POST", token },
    ),

  getGameState: (token: string, roomCode: string) =>
    request<GameState>(`/game/game/${encodeURIComponent(roomCode)}/state`, { token }),

  nightAction: (token: string, gameId: string, targetId: number, actionType: BackendAction) =>
    request<{ message: string; action_id: string }>(`/game/${encodeURIComponent(gameId)}/action`, {
      method: "POST",
      token,
      body: JSON.stringify({ target_id: targetId, action_type: actionType }),
    }),

  vote: (token: string, gameId: string, targetId: number) =>
    request<string>(`/game/${encodeURIComponent(gameId)}/vote`, {
      method: "POST",
      token,
      body: JSON.stringify({ target_id: targetId, action_type: "VOTE" }),
    }),

  detectiveResult: (token: string, gameId: string) =>
    request<{ target_id: number; is_mafia: boolean }>(
      `/game/${encodeURIComponent(gameId)}/detective-result`,
      { token },
    ),
};
