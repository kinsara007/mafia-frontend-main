export type Role = "Mafia" | "Detective" | "Doctor" | "Villager";

export type Screen =
  | "auth"
  | "home"
  | "lobby"
  | "role-reveal"
  | "night-phase"
  | "night-result"
  | "day-phase"
  | "day-result"
  | "game-over";

export type DaySubphase = "DISCUSSION" | "VOTING";
export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export type BackendRole = "MAFIA" | "DETECTIVE" | "DOCTOR" | "VILLAGER";
export type BackendPhase =
  | "NIGHT"
  | "MORNING"
  | "VOTING"
  | "ENDED"
  | "DAY_DISCUSSION";
export type BackendAction = "KILL" | "INVESTIGATE" | "PROTECT" | "VOTE";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface Player {
  id: string;
  userId: number;
  name: string;
  initials: string;
  role: Role;
  roleKnown: boolean;
  isAlive: boolean;
  isHost: boolean;
}

export interface GamePlayerState {
  user_id: number;
  name?: string;
  is_alive: boolean;
  role?: string | null;
}

export interface GameState {
  status: "LOBBY" | "IN_PROGRESS" | "COMPLETED";
  game_id?: string;
  phase?: BackendPhase | string;
  round_number?: number;
  winner?: string | null;
  my_role?: string;
  my_is_alive?: boolean;
  my_action_submitted?: boolean;
  host_id?: number;
  players?: GamePlayerState[] | number[];
  room_code?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  time: string;
}

export interface VoteEntry {
  targetId: string;
  voterIds: string[];
}

export const ROLE_META: Record<
  Role,
  {
    label: string;
    description: string;
    icon: string;
    color: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeClass: string;
  }
> = {
  Mafia: {
    label: "Mafia",
    description: "Each night, choose a Villager to eliminate. Stay hidden by day.",
    icon: "🔪",
    color: "#e74c3c",
    bgClass: "bg-mafia/10",
    textClass: "text-mafia",
    borderClass: "border-mafia/30",
    badgeClass: "bg-mafia text-white",
  },
  Detective: {
    label: "Detective",
    description: "Each night, investigate one player to learn if they are Mafia.",
    icon: "🔍",
    color: "#3d8ef8",
    bgClass: "bg-detective/10",
    textClass: "text-detective",
    borderClass: "border-detective/30",
    badgeClass: "bg-detective text-white",
  },
  Doctor: {
    label: "Doctor",
    description:
      "Each night, choose one player (including yourself) to protect from elimination.",
    icon: "💉",
    color: "#2ecc71",
    bgClass: "bg-doctor/10",
    textClass: "text-doctor",
    borderClass: "border-doctor/30",
    badgeClass: "bg-doctor text-white",
  },
  Villager: {
    label: "Villager",
    description: "Use your wits during the day to identify and vote out the Mafia.",
    icon: "🏘️",
    color: "#8899aa",
    bgClass: "bg-villager/10",
    textClass: "text-villager",
    borderClass: "border-villager/30",
    badgeClass: "bg-villager/70 text-white",
  },
};

export const ROLE_FROM_BACKEND: Record<BackendRole, Role> = {
  MAFIA: "Mafia",
  DETECTIVE: "Detective",
  DOCTOR: "Doctor",
  VILLAGER: "Villager",
};

export const ACTION_FOR_ROLE: Record<Role, BackendAction | null> = {
  Mafia: "KILL",
  Detective: "INVESTIGATE",
  Doctor: "PROTECT",
  Villager: null,
};

export const MIN_PLAYERS = 5;
export const MAX_PLAYERS = 8;

export const PHASE_SECONDS: Record<string, number> = {
  NIGHT: 180,
  DAY_DISCUSSION: 180,
  VOTING: 180,
};

export function parseWinner(raw: unknown): "MAFIA" | "VILLAGER" | null {
  if (typeof raw !== "string") return null;
  const value = raw.toUpperCase();
  if (value.includes("MAFIA")) return "MAFIA";
  if (value.includes("VILLAGER")) return "VILLAGER";
  return null;
}
