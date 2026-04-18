import type { DatabaseClient } from "../db/DatabaseClient";
import type { User } from "../models";
import { PublicSlugGenerator } from "../users/PublicSlugGenerator";
import type { AuthProvider } from "./AuthProvider";

interface UserRow {
  id: number;
  public_slug: string;
  username: string;
  avatar_url: string | null;
  forza_gamertag: string | null;
  created_at: string;
  banned_at: string | null;
  ban_reason: string | null;
}

const USER_COLUMNS = `u.id, u.public_slug, u.username, u.avatar_url, u.forza_gamertag, u.created_at, u.banned_at, u.ban_reason`;

const SLUG_INSERT_MAX_ATTEMPTS = 3;

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    publicSlug: row.public_slug,
    username: row.username,
    avatarUrl: row.avatar_url,
    forzaGamertag: row.forza_gamertag,
    createdAt: row.created_at,
    bannedAt: row.banned_at,
    banReason: row.ban_reason,
  };
}

function isUniqueConstraintError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const message = (err as { message?: unknown }).message;
  return typeof message === "string" && message.includes("UNIQUE constraint");
}

export class AuthCoordinator {
  private db: DatabaseClient;
  private providers: Map<string, AuthProvider>;

  constructor(db: DatabaseClient, providers: Map<string, AuthProvider>) {
    this.db = db;
    this.providers = providers;
  }

  getProvider(providerName: string): AuthProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Unknown auth provider: ${providerName}`);
    }
    return provider;
  }

  async authenticateUser(providerName: string, code: string): Promise<User> {
    const provider = this.getProvider(providerName);
    const tokens = await provider.exchangeCode(code);
    const profile = await provider.getUserProfile(tokens.accessToken);

    const existingRow = await this.db.queryOne<UserRow>(
      `SELECT ${USER_COLUMNS}
       FROM users u
       JOIN auth_accounts aa ON u.id = aa.user_id
       WHERE aa.provider = ? AND aa.provider_id = ?`,
      [providerName, profile.providerId],
    );

    if (existingRow) {
      await this.db.execute(`UPDATE users SET avatar_url = ? WHERE id = ?`, [
        profile.avatarUrl,
        existingRow.id,
      ]);
      await this.db.execute(
        `UPDATE auth_accounts SET provider_username = ? WHERE provider = ? AND provider_id = ?`,
        [profile.username, providerName, profile.providerId],
      );
      return mapRowToUser({ ...existingRow, avatar_url: profile.avatarUrl });
    }

    return this.createUserAtomically(providerName, profile);
  }

  private async createUserAtomically(
    providerName: string,
    profile: {
      providerId: string;
      username: string;
      avatarUrl: string | null;
    },
  ): Promise<User> {
    let lastError: unknown = null;

    for (let attempt = 0; attempt < SLUG_INSERT_MAX_ATTEMPTS; attempt++) {
      const slug = PublicSlugGenerator.generate();
      const insertUser = this.db
        .prepare(
          `INSERT INTO users (public_slug, username, avatar_url) VALUES (?, ?, ?)`,
        )
        .bind(slug, profile.username, profile.avatarUrl);

      const insertAuthAccount = this.db
        .prepare(
          `INSERT INTO auth_accounts (user_id, provider, provider_id, provider_username)
           VALUES (last_insert_rowid(), ?, ?, ?)`,
        )
        .bind(providerName, profile.providerId, profile.username);

      try {
        await this.db.batch([insertUser, insertAuthAccount]);
        break;
      } catch (error: unknown) {
        const existing = await this.db.queryOne<UserRow>(
          `SELECT ${USER_COLUMNS}
           FROM users u
           JOIN auth_accounts aa ON u.id = aa.user_id
           WHERE aa.provider = ? AND aa.provider_id = ?`,
          [providerName, profile.providerId],
        );
        if (existing) {
          return mapRowToUser(existing);
        }
        if (!isUniqueConstraintError(error)) throw error;
        lastError = error;
        if (attempt === SLUG_INSERT_MAX_ATTEMPTS - 1) {
          throw lastError;
        }
      }
    }

    const newRow = await this.db.queryOne<UserRow>(
      `SELECT ${USER_COLUMNS}
       FROM users u
       JOIN auth_accounts aa ON u.id = aa.user_id
       WHERE aa.provider = ? AND aa.provider_id = ?`,
      [providerName, profile.providerId],
    );

    if (!newRow) {
      throw new Error("Failed to create user");
    }

    return mapRowToUser(newRow);
  }
}
