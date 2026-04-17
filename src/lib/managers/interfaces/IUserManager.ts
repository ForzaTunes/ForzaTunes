export interface UserRow {
  id: number;
  username: string;
  avatar_url: string | null;
  forza_gamertag: string | null;
  created_at: string;
  banned_at: string | null;
  ban_reason: string | null;
}

export interface BanStatus {
  banned: boolean;
  bannedAt: string | null;
  banReason: string | null;
}

import type { UserProfile } from "../../models";

export interface IUserManager {
  findById(id: number): Promise<UserRow | null>;
  getProfile(id: number): Promise<UserProfile | null>;
  getBanStatus(userId: number): Promise<BanStatus>;
  findByProvider(
    provider: string,
    providerId: string,
  ): Promise<UserRow | null>;
  create(username: string, avatarUrl: string | null): Promise<UserRow>;
  createWithAuthAccount(
    username: string,
    avatarUrl: string | null,
    provider: string,
    providerId: string,
    providerUsername: string,
  ): Promise<UserRow>;
  updateForzaGamertag(userId: number, gamertag: string): Promise<void>;
}
