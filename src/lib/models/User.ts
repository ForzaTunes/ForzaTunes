export interface User {
  id: number;
  username: string;
  avatarUrl: string | null;
  forzaGamertag: string | null;
  createdAt: string;
  bannedAt: string | null;
  banReason: string | null;
}

export interface UserProfile {
  id: number;
  username: string;
  avatarUrl: string | null;
  forzaGamertag: string | null;
  createdAt: string;
}
