import type { UserProfile } from "../../models";
import type { BanStatus, IUserManager, UserRow } from "../interfaces";
import { mapRowToUserProfile } from "../userMappers";
import { DemoStore } from "./DemoStore";

export class DemoUserManager implements IUserManager {
  constructor(private store: DemoStore) {}

  async findById(id: number): Promise<UserRow | null> {
    return this.store.users.find((u) => u.id === id) ?? null;
  }

  async getProfile(id: number): Promise<UserProfile | null> {
    const row = await this.findById(id);
    return row ? mapRowToUserProfile(row) : null;
  }

  async getBanStatus(userId: number): Promise<BanStatus> {
    const user = await this.findById(userId);
    return {
      banned: !!user?.banned_at,
      bannedAt: user?.banned_at ?? null,
      banReason: user?.ban_reason ?? null,
    };
  }

  async findByProvider(
    _provider: string,
    _providerId: string,
  ): Promise<UserRow | null> {
    return null;
  }

  async create(
    username: string,
    avatarUrl: string | null,
  ): Promise<UserRow> {
    const user: UserRow = {
      id: nextUserId(this.store),
      username,
      avatar_url: avatarUrl,
      forza_gamertag: null,
      created_at: new Date().toISOString(),
      banned_at: null,
      ban_reason: null,
    };
    this.store.users.push(user);
    return user;
  }

  async createWithAuthAccount(
    username: string,
    avatarUrl: string | null,
    _provider: string,
    _providerId: string,
    _providerUsername: string,
  ): Promise<UserRow> {
    return this.create(username, avatarUrl);
  }

  async updateForzaGamertag(
    userId: number,
    gamertag: string,
  ): Promise<void> {
    const user = this.store.users.find((u) => u.id === userId);
    if (user) user.forza_gamertag = gamertag;
  }
}

function nextUserId(store: DemoStore): number {
  let max = 0;
  for (const u of store.users) {
    if (u.id > max) max = u.id;
  }
  return max + 1;
}
