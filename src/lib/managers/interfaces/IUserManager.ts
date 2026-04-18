export interface UserRow {
  id: number;
  public_slug: string;
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
  findByPublicSlug(slug: string): Promise<UserRow | null>;
  /**
   * Case-insensitive lookup by `forza_gamertag`. Returns the matching row
   * only when exactly one user claims the gamertag; returns `null` on zero
   * or multiple matches so ambiguous aliases cannot resolve to a single
   * profile.
   */
  findByGamertag(gamertag: string): Promise<UserRow | null>;
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
