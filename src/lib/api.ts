// const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// import type { BackendAction, GameState } from "./types";

// export class ApiError extends Error {
//   status: number;
//   detail: string;

//   constructor(status: number, detail: string) {
//     super(detail);
//     this.status = status;
//     this.detail = detail;
//   }
// }

// export interface AuthUserResponse {
//   id: number;
//   name: string;
//   email: string;
// }

// export interface RoomDetails {
//   room_id: string;
//   host_id: number;
//   room_status: "WAITING" | "IN_PROGRESS" | "FINISHED";
//   players: AuthUserResponse[];
// }

// async function parseError(res: Response): Promise<string> {
//   try {
//     const data = await res.json();
//     if (typeof data?.detail === "string") return data.detail;
//     if (Array.isArray(data?.detail)) {
//       return data.detail.map((d: { msg?: string }) => d.msg ?? JSON.stringify(d)).join(", ");
//     }
//     return JSON.stringify(data);
//   } catch {
//     return res.statusText || "Request failed";
//   }
// }

// async function request<T>(
//   path: string,
//   options: RequestInit & { token?: string | null } = {},
// ): Promise<T> {
//   const { token, headers, ...rest } = options;
//   const res = await fetch(`${API_URL}${path}`, {
//     ...rest,
//     headers: {
//       "Content-Type": "application/json",
//       ...(token ? { access_token: token } : {}),
//       ...headers,
//     },
//   });
//   if (!res.ok) {
//     throw new ApiError(res.status, await parseError(res));
//   }
//   if (res.status === 204) return undefined as T;
//   return res.json() as Promise<T>;
// }

// export const api = {
//   register: (name: string, email: string, password: string) =>
//     request<AuthUserResponse>("/user/register", {
//       method: "POST",
//       body: JSON.stringify({ name, email, password }),
//     }),

//   login: (email: string, password: string) =>
//     request<{
//       access_token: string;
//       user: AuthUserResponse;
//     }>("/user/login", {
//       method: "POST",
//       body: JSON.stringify({ email, password }),
//     }),

//   createRoom: (token: string) =>
//     request<{ room_code: string; room_id: string }>("/room/create", {
//       method: "POST",
//       token,
//     }),

//   joinRoom: (token: string, roomCode: string) =>
//     request<{ msg: string; room_id: string; room_players: unknown[] }>(
//       `/room/${encodeURIComponent(roomCode)}/join`,
//       { method: "POST", token },
//     ),

//   getRoomDetails: (token: string, roomCode: string) =>
//     request<RoomDetails>(`/room/${encodeURIComponent(roomCode)}`, { token }),

//   leaveRoom: (token: string, roomCode: string) =>
//     request<{ message: string }>(`/room/${encodeURIComponent(roomCode)}/leave`, {
//       method: "POST",
//       token,
//     }),

//   startGame: (token: string, roomCode: string) =>
//     request<{ msg: string; game_id: string; room_id: string }>(
//       `/game/${encodeURIComponent(roomCode)}/start`,
//       { method: "POST", token },
//     ),

//   getGameState: (token: string, roomCode: string) =>
//     request<GameState>(`/game/game/${encodeURIComponent(roomCode)}/state`, { token }),

//   nightAction: (token: string, gameId: string, targetId: number, actionType: BackendAction) =>
//     request<{ message: string; action_id: string }>(`/game/${encodeURIComponent(gameId)}/action`, {
//       method: "POST",
//       token,
//       body: JSON.stringify({ target_id: targetId, action_type: actionType }),
//     }),

//   vote: (token: string, gameId: string, targetId: number) =>
//     request<string>(`/game/${encodeURIComponent(gameId)}/vote`, {
//       method: "POST",
//       token,
//       body: JSON.stringify({ target_id: targetId, action_type: "VOTE" }),
//     }),

//   detectiveResult: (token: string, gameId: string) =>
//     request<{ target_id: number; is_mafia: boolean }>(
//       `/game/${encodeURIComponent(gameId)}/detective-result`,
//       { token },
//     ),
// };




import type { BackendAction, GameState } from "./types";
import { getStoredToken, getStoredRefreshToken, setTokens } from "./storage";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

/* ------------------------------------------------------------------ */
/* Token refresh                                                       */
/* ------------------------------------------------------------------ */

// Called when the refresh token itself is rejected (the session is really over).
let onAuthFailure: (() => void) | null = null;
export const setAuthFailureHandler = (fn: (() => void) | null) => {
  onAuthFailure = fn;
};

// Only 401/403 mean "your session is dead". Network errors must NOT log the player out.
const isAuthError = (e: unknown) =>
  e instanceof ApiError && (e.status === 401 || e.status === 403);

let refreshPromise: Promise<string> | null = null;

export function refreshTokens(): Promise<string> {
  // One shared refresh, even if several requests fail at the same moment.
  refreshPromise ??= (async () => {
    const refresh = getStoredRefreshToken();
    if (!refresh) throw new ApiError(401, "No refresh token");

    const res = await fetch(`${API_URL}/user/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) throw new ApiError(res.status, await parseError(res));

    const data = (await res.json()) as { access_token: string; refresh_token: string };
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

function expiresSoon(token: string, skewMs = 60_000): boolean {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64)).exp * 1000 - Date.now() < skewMs;
  } catch {
    return true;
  }
}

// Use this before opening a WebSocket: returns a token that is good for at least a minute.
export async function getValidToken(): Promise<string> {
  const token = getStoredToken();
  if (token && !expiresSoon(token)) return token;
  try {
    return await refreshTokens();
  } catch (e) {
    if (isAuthError(e)) onAuthFailure?.();
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* Request helper                                                      */
/* ------------------------------------------------------------------ */

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;

  const send = (t?: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(t ? { access_token: t } : {}),
        ...headers,
      },
    });

  // Prefer the latest stored token over the one the caller captured earlier.
  let res = await send(token ? (getStoredToken() ?? token) : null);

  // Expired token: refresh once and retry the original request.
  if (res.status === 401 && token) {
    try {
      res = await send(await refreshTokens());
    } catch (e) {
      if (isAuthError(e)) onAuthFailure?.();
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export const api = {
  register: (name: string, email: string, password: string) =>
    request<AuthUserResponse>("/user/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{
      access_token: string;
      refresh_token: string;
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