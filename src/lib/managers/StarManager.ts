import type { DatabaseClient } from "../db/DatabaseClient";
import type { ICacheVersionManager } from "../middleware/CacheVersionManager";
import { NullCacheVersionManager } from "../middleware/NullCacheVersionManager";
import type { TuneSortField, TuneWithDetails } from "../models";
import type { IStarManager, StarredTunesQuery } from "./interfaces";
import {
  type TuneWithDetailsRow,
  mapRowToTuneWithDetails,
} from "./tuneMappers";

const STARRED_SORT_MAP: Record<TuneSortField, string> = {
  newest: "ORDER BY s.created_at DESC",
  most_starred:
    "ORDER BY COALESCE(sc.star_count, 0) DESC, s.created_at DESC",
  pi_asc: "ORDER BY t.pi_rating ASC, s.created_at DESC",
  pi_desc: "ORDER BY t.pi_rating DESC, s.created_at DESC",
};

const DEFAULT_STARRED_SORT: TuneSortField = "newest";

export class StarManager implements IStarManager {
  constructor(
    private db: DatabaseClient,
    private cacheVersions: ICacheVersionManager = new NullCacheVersionManager(),
  ) {}

  async star(userId: number, tuneId: number): Promise<void> {
    await this.db.execute(
      `INSERT OR IGNORE INTO stars (user_id, tune_id) VALUES (?, ?)`,
      [userId, tuneId],
    );
    await this.cacheVersions.bump();
  }

  async unstar(userId: number, tuneId: number): Promise<void> {
    await this.db.execute(
      `DELETE FROM stars WHERE user_id = ? AND tune_id = ?`,
      [userId, tuneId],
    );
    await this.cacheVersions.bump();
  }

  async toggleStar(userId: number, tuneId: number): Promise<boolean> {
    const existing = await this.db.queryOne<{ id: number }>(
      `SELECT id FROM stars WHERE user_id = ? AND tune_id = ?`,
      [userId, tuneId],
    );

    if (existing) {
      await this.db.execute(
        `DELETE FROM stars WHERE user_id = ? AND tune_id = ?`,
        [userId, tuneId],
      );
      await this.cacheVersions.bump();
      return false;
    }

    await this.db.execute(
      `INSERT OR IGNORE INTO stars (user_id, tune_id) VALUES (?, ?)`,
      [userId, tuneId],
    );
    await this.cacheVersions.bump();
    return true;
  }

  async isStarred(userId: number, tuneId: number): Promise<boolean> {
    const row = await this.db.queryOne<{ id: number }>(
      `SELECT id FROM stars WHERE user_id = ? AND tune_id = ?`,
      [userId, tuneId],
    );
    return row !== null;
  }

  async getStarCount(tuneId: number): Promise<number> {
    const row = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) AS count FROM stars WHERE tune_id = ?`,
      [tuneId],
    );
    return row?.count ?? 0;
  }

  async countReceivedByUser(userId: number): Promise<number> {
    const row = await this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM stars s
       JOIN tunes t ON t.id = s.tune_id
       WHERE t.user_id = ?`,
      [userId],
    );
    return row?.count ?? 0;
  }

  async getUserStarredTuneIds(
    userId: number,
    tuneIds: number[],
  ): Promise<Set<number>> {
    if (tuneIds.length === 0) return new Set();

    const placeholders = tuneIds.map(() => "?").join(", ");
    const rows = await this.db.query<{ tune_id: number }>(
      `SELECT tune_id FROM stars WHERE user_id = ? AND tune_id IN (${placeholders})`,
      [userId, ...tuneIds],
    );

    return new Set(rows.map((r) => r.tune_id));
  }

  async getStarredTunes(
    userId: number,
    limit: number,
    offset: number,
    opts?: StarredTunesQuery,
  ): Promise<TuneWithDetails[]> {
    const sort = opts?.sort ?? DEFAULT_STARRED_SORT;
    const orderClause =
      STARRED_SORT_MAP[sort] ?? STARRED_SORT_MAP[DEFAULT_STARRED_SORT];

    const params: unknown[] = [userId];
    let gameClause = "";
    if (typeof opts?.gameId === "number") {
      gameClause = " AND t.game_id = ?";
      params.push(opts.gameId);
    }
    params.push(limit, offset);

    const rows = await this.db.query<TuneWithDetailsRow>(
      `SELECT
         t.id, t.game_id, t.share_code, t.car_id, t.title, t.description,
         t.creator_gamertag, t.tune_type, t.pi_rating, t.car_class,
         t.drivetrain, t.track_name,
         t.user_id, t.created_at, t.updated_at,
         t.source_url, t.imported_at,
         c.make AS car_make, c.model AS car_model, c.year AS car_year,
         c.category AS car_category, c.image_url AS car_image_url,
         c.image_key AS car_image_key,
         u.username AS creator_username,
         u.public_slug AS creator_public_slug,
         COALESCE(sc.star_count, 0) AS star_count
       FROM stars s
       JOIN tunes t ON t.id = s.tune_id
       JOIN cars c ON c.id = t.car_id
       JOIN users u ON u.id = t.user_id
       LEFT JOIN (
         SELECT tune_id, COUNT(*) AS star_count
         FROM stars
         GROUP BY tune_id
       ) sc ON sc.tune_id = t.id
       WHERE s.user_id = ?${gameClause}
       ${orderClause}
       LIMIT ? OFFSET ?`,
      params,
    );
    return rows.map(mapRowToTuneWithDetails);
  }
}
