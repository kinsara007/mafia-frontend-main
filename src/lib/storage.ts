// import type { AuthUser } from "./types";

// const TOKEN_KEY = "mafia.access_token";
// const USER_KEY = "mafia.user";
// const ROOM_KEY = "mafia.room";

// export interface StoredRoom {
//   roomCode: string;
//   roomId: string;
// }

// export function getStoredToken(): string | null {
//   if (typeof window === "undefined") return null;
//   return localStorage.getItem(TOKEN_KEY);
// }

// export function getStoredUser(): AuthUser | null {
//   if (typeof window === "undefined") return null;
//   const raw = localStorage.getItem(USER_KEY);
//   if (!raw) return null;
//   try {
//     return JSON.parse(raw) as AuthUser;
//   } catch {
//     return null;
//   }
// }

// export function persistSession(token: string, user: AuthUser) {
//   localStorage.setItem(TOKEN_KEY, token);
//   localStorage.setItem(USER_KEY, JSON.stringify(user));
// }

// export function clearSession() {
//   localStorage.removeItem(TOKEN_KEY);
//   localStorage.removeItem(USER_KEY);
//   localStorage.removeItem(ROOM_KEY);
// }

// export function persistRoom(room: StoredRoom) {
//   localStorage.setItem(ROOM_KEY, JSON.stringify(room));
// }

// export function getStoredRoom(): StoredRoom | null {
//   if (typeof window === "undefined") return null;
//   const raw = localStorage.getItem(ROOM_KEY);
//   if (!raw) return null;
//   try {
//     const parsed = JSON.parse(raw) as StoredRoom;
//     if (!parsed.roomCode || !parsed.roomId) return null;
//     return parsed;
//   } catch {
//     return null;
//   }
// }

// export function clearRoom() {
//   localStorage.removeItem(ROOM_KEY);
// }


import type { AuthUser } from "./types";

const TOKEN_KEY = "mafia.access_token";
const REFRESH_KEY = "mafia.refresh_token";
const USER_KEY = "mafia.user";
const ROOM_KEY = "mafia.room";

export interface StoredRoom {
  roomCode: string;
  roomId: string;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

// Used by the refresh flow: swaps in a new pair without touching the user or room.
export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function persistSession(token: string, user: AuthUser, refresh: string) {
  setTokens(token, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROOM_KEY);
}

export function persistRoom(room: StoredRoom) {
  localStorage.setItem(ROOM_KEY, JSON.stringify(room));
}

export function getStoredRoom(): StoredRoom | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ROOM_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredRoom;
    if (!parsed.roomCode || !parsed.roomId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRoom() {
  localStorage.removeItem(ROOM_KEY);
}