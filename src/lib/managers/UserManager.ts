import type { DatabaseClient } from "../db/DatabaseClient";
import type { UserProfile } from "../models";
import type { BanStatus, IUserManager, UserRow } from "./interfaces";
import { mapRowToUserProfile } from "./userMappers";

export type { UserRow, BanStatus } from "./interfaces";

const SELECT_COLUMNS = `id, username, avatar_url, forza_gamertag, created_at, banned_at, ban_reason`;

export class UserManager implements IUserManager {
  constructor(private db: DatabaseClient) {}

  async findById(id: number): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE id = ?`,
      [id],
    );
  }

  async getProfile(id: number): Promise<UserProfile | null> {
    const row = await this.findById(id);
    return row ? mapRowToUserProfile(row) : null;
  }

  async getBanStatus(userId: number): Promise<BanStatus> {
    const row = await this.db.queryOne<{
      banned_at: string | null;
      ban_reason: string | null;
    }>(`SELECT banned_at, ban_reason FROM users WHERE id = ?`, [userId]);
    return {
      banned: row?.banned_at !== null && row?.banned_at !== undefined,
      bannedAt: row?.banned_at ?? null,
      banReason: row?.ban_reason ?? null,
    };
  }

  async findByProvider(
    provider: string,
    providerId: string,
  ): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>(
      `SELECT u.id, u.username, u.avatar_url, u.forza_gamertag, u.created_at, u.banned_at, u.ban_reason
       FROM users u
       JOIN auth_accounts aa ON u.id = aa.user_id
       WHERE aa.provider = ? AND aa.provider_id = ?`,
      [provider, providerId],
    );
  }

  async create(username: string, avatarUrl: string | null): Promise<UserRow> {
    await this.db.execute(
      `INSERT INTO users (username, avatar_url) VALUES (?, ?)`,
      [username, avatarUrl],
    );

    const user = await this.db.queryOne<UserRow>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE rowid = last_insert_rowid()`,
    );

    if (!user) {
      throw new Error("Failed to retrieve created user");
    }

    return user;
  }

  async createWithAuthAccount(
    username: string,
    avatarUrl: string | null,
    provider: string,
    providerId: string,
    providerUsername: string,
  ): Promise<UserRow> {
    const insertUser = this.db
      .prepare(`INSERT INTO users (username, avatar_url) VALUES (?, ?)`)
      .bind(username, avatarUrl);

    await this.db.batch([insertUser]);

    const user = await this.db.queryOne<UserRow>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE rowid = last_insert_rowid()`,
    );

    if (!user) {
      throw new Error("Failed to retrieve created user");
    }

    await this.db.execute(
      `INSERT INTO auth_accounts (user_id, provider, provider_id, provider_username)
       VALUES (?, ?, ?, ?)`,
      [user.id, provider, providerId, providerUsername],
    );

    return user;
  }

  async updateForzaGamertag(
    userId: number,
    gamertag: string,
  ): Promise<void> {
    await this.db.execute(
      `UPDATE users SET forza_gamertag = ? WHERE id = ?`,
      [gamertag, userId],
    );
  }
}
