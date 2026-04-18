import type { DatabaseClient } from "../db/DatabaseClient";
import type { UserProfile } from "../models";
import { PublicSlugGenerator } from "../users/PublicSlugGenerator";
import type { BanStatus, IUserManager, UserRow } from "./interfaces";
import { mapRowToUserProfile } from "./userMappers";

export type { UserRow, BanStatus } from "./interfaces";

const SELECT_COLUMNS = `id, public_slug, username, avatar_url, forza_gamertag, created_at, banned_at, ban_reason`;

const SLUG_INSERT_MAX_ATTEMPTS = 3;

/**
 * Detects D1/SQLite UNIQUE constraint failures so that slug generation can
 * retry without swallowing unrelated errors.
 */
function isUniqueConstraintError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = (err as { message?: unknown }).message;
  return typeof message === "string" && message.includes("UNIQUE constraint");
}

export class UserManager implements IUserManager {
  constructor(private db: DatabaseClient) {}

  async findById(id: number): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE id = ?`,
      [id],
    );
  }

  async findByPublicSlug(slug: string): Promise<UserRow | null> {
    return this.db.queryOne<UserRow>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE public_slug = ?`,
      [slug],
    );
  }

  async findByGamertag(gamertag: string): Promise<UserRow | null> {
    const rows = await this.db.query<UserRow>(
      `SELECT ${SELECT_COLUMNS}
       FROM users
       WHERE forza_gamertag IS NOT NULL
         AND LOWER(forza_gamertag) = LOWER(?)
       LIMIT 2`,
      [gamertag],
    );
    if (rows.length !== 1) return null;
    return rows[0] ?? null;
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
      `SELECT u.id, u.public_slug, u.username, u.avatar_url, u.forza_gamertag,
              u.created_at, u.banned_at, u.ban_reason
       FROM users u
       JOIN auth_accounts aa ON u.id = aa.user_id
       WHERE aa.provider = ? AND aa.provider_id = ?`,
      [provider, providerId],
    );
  }

  async create(username: string, avatarUrl: string | null): Promise<UserRow> {
    return this.insertUserWithSlug(async (slug) => {
      await this.db.execute(
        `INSERT INTO users (public_slug, username, avatar_url) VALUES (?, ?, ?)`,
        [slug, username, avatarUrl],
      );
    });
  }

  async createWithAuthAccount(
    username: string,
    avatarUrl: string | null,
    provider: string,
    providerId: string,
    providerUsername: string,
  ): Promise<UserRow> {
    const user = await this.insertUserWithSlug(async (slug) => {
      const insertUser = this.db
        .prepare(
          `INSERT INTO users (public_slug, username, avatar_url) VALUES (?, ?, ?)`,
        )
        .bind(slug, username, avatarUrl);
      await this.db.batch([insertUser]);
    });

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

  /**
   * Runs an insert callback with a freshly generated public slug, retrying
   * on the vanishingly rare UNIQUE collision. Other errors surface as-is.
   */
  private async insertUserWithSlug(
    insert: (slug: string) => Promise<void>,
  ): Promise<UserRow> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < SLUG_INSERT_MAX_ATTEMPTS; attempt++) {
      const slug = PublicSlugGenerator.generate();
      try {
        await insert(slug);
        const row = await this.db.queryOne<UserRow>(
          `SELECT ${SELECT_COLUMNS} FROM users WHERE rowid = last_insert_rowid()`,
        );
        if (!row) {
          throw new Error("Failed to retrieve created user");
        }
        return row;
      } catch (err) {
        if (!isUniqueConstraintError(err)) throw err;
        lastError = err;
      }
    }
    throw lastError ?? new Error("Failed to allocate public_slug after retries");
  }
}
