import type { DatabaseClient } from "../db/DatabaseClient";
import type { ICacheVersionManager } from "../middleware/CacheVersionManager";
import { NullCacheVersionManager } from "../middleware/NullCacheVersionManager";
import type {
  TuneWithDetails,
  TuneSearchFilters,
  TuneSortField,
  TunePagination,
  PaginatedResult,
} from "../models";
import type {
  ITuneManager,
  ValidatedTuneSubmission,
  TuneUpdateInput,
  UserTunesQuery,
} from "./interfaces";
import {
  type TuneRow,
  type TuneWithDetailsRow,
  mapRowToTune,
  mapRowToTuneWithDetails,
} from "./tuneMappers";

export type { ValidatedTuneSubmission, TuneUpdateInput } from "./interfaces";

const BASE_SELECT = `
SELECT
  t.id, t.game_id, t.share_code, t.car_id, t.title, t.description,
  t.creator_gamertag, t.tune_type, t.pi_rating, t.car_class,
  t.drivetrain, t.track_name,
  t.user_id, t.created_at, t.updated_at,
  c.make AS car_make, c.model AS car_model, c.year AS car_year,
  c.category AS car_category, c.image_url AS car_image_url,
  c.image_key AS car_image_key,
  u.username AS creator_username,
  COALESCE(sc.star_count, 0) AS star_count
FROM tunes t
JOIN cars c ON c.id = t.car_id
JOIN users u ON u.id = t.user_id
LEFT JOIN (
  SELECT tune_id, COUNT(*) AS star_count
  FROM stars
  GROUP BY tune_id
) sc ON sc.tune_id = t.id`;

const SORT_MAP: Record<TuneSortField, string> = {
  newest: "ORDER BY t.created_at DESC",
  most_starred: "ORDER BY star_count DESC, t.created_at DESC",
  pi_asc: "ORDER BY t.pi_rating ASC, t.created_at DESC",
  pi_desc: "ORDER BY t.pi_rating DESC, t.created_at DESC",
};

const DEFAULT_SORT: TuneSortField = "newest";

function escapeLike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export class TuneManager implements ITuneManager {
  constructor(
    private db: DatabaseClient,
    private cacheVersions: ICacheVersionManager = new NullCacheVersionManager(),
  ) {}

  async search(
    gameId: number,
    filters: TuneSearchFilters,
    sort: TuneSortField,
    pagination: TunePagination,
  ): Promise<PaginatedResult<TuneWithDetails>> {
    const conditions: string[] = ["t.game_id = ?1"];
    const params: unknown[] = [gameId];
    let paramIndex = 2;

    if (filters.query) {
      const likeParam = `%${escapeLike(filters.query)}%`;
      conditions.push(
        `(t.title LIKE ?${paramIndex} ESCAPE '\\'
          OR t.creator_gamertag LIKE ?${paramIndex} ESCAPE '\\'
          OR c.make LIKE ?${paramIndex} ESCAPE '\\'
          OR c.model LIKE ?${paramIndex} ESCAPE '\\')`,
      );
      params.push(likeParam);
      paramIndex++;
    }

    const addInClause = (
      column: string,
      values: readonly string[] | undefined,
    ) => {
      if (!values || values.length === 0) return;
      const placeholders = values.map(() => `?${paramIndex++}`).join(", ");
      conditions.push(`${column} IN (${placeholders})`);
      for (const v of values) params.push(v);
    };

    addInClause("t.tune_type", filters.tuneTypes);
    addInClause("t.car_class", filters.carClasses);
    addInClause("c.make", filters.makes);
    addInClause("t.drivetrain", filters.drivetrains);

    if (typeof filters.piMin === "number") {
      conditions.push(`t.pi_rating >= ?${paramIndex}`);
      params.push(filters.piMin);
      paramIndex++;
    }

    if (typeof filters.piMax === "number") {
      conditions.push(`t.pi_rating <= ?${paramIndex}`);
      params.push(filters.piMax);
      paramIndex++;
    }

    if (typeof filters.carId === "number") {
      conditions.push(`t.car_id = ?${paramIndex}`);
      params.push(filters.carId);
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");
    const orderClause = SORT_MAP[sort] ?? SORT_MAP[DEFAULT_SORT];
    const offset = (pagination.page - 1) * pagination.pageSize;

    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    params.push(pagination.pageSize, offset);

    const dataQuery = `${BASE_SELECT} WHERE ${whereClause} ${orderClause} LIMIT ?${limitParam} OFFSET ?${offsetParam}`;
    const countQuery = `SELECT COUNT(*) AS total FROM tunes t JOIN cars c ON c.id = t.car_id WHERE ${whereClause}`;

    const filterParams = params.slice(0, -2);

    const [items, countResult] = await Promise.all([
      this.db.query<TuneWithDetailsRow>(dataQuery, params),
      this.db.queryOne<{ total: number }>(countQuery, filterParams),
    ]);

    const total = countResult?.total ?? 0;
    return {
      items: items.map(mapRowToTuneWithDetails),
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize) || 1,
    };
  }

  async getById(id: number): Promise<TuneWithDetails | null> {
    const row = await this.db.queryOne<TuneWithDetailsRow>(
      `${BASE_SELECT} WHERE t.id = ?1`,
      [id],
    );
    return row ? mapRowToTuneWithDetails(row) : null;
  }

  async getRecent(
    gameId: number,
    limit: number,
  ): Promise<TuneWithDetails[]> {
    const rows = await this.db.query<TuneWithDetailsRow>(
      `${BASE_SELECT} WHERE t.game_id = ?1 ORDER BY t.created_at DESC LIMIT ?2`,
      [gameId, limit],
    );
    return rows.map(mapRowToTuneWithDetails);
  }

  async getRecentAcrossGames(limit: number): Promise<TuneWithDetails[]> {
    const rows = await this.db.query<TuneWithDetailsRow>(
      `${BASE_SELECT} ORDER BY t.created_at DESC LIMIT ?1`,
      [limit],
    );
    return rows.map(mapRowToTuneWithDetails);
  }

  async getTrendingAcrossGames(
    sinceDays: number,
    limit: number,
  ): Promise<TuneWithDetails[]> {
    const rows = await this.db.query<TuneWithDetailsRow>(
      `${BASE_SELECT}
       WHERE t.created_at >= datetime('now', '-' || ?1 || ' days')
       ORDER BY COALESCE(sc.star_count, 0) DESC, t.created_at DESC
       LIMIT ?2`,
      [sinceDays, limit],
    );
    return rows.map(mapRowToTuneWithDetails);
  }

  async getTrending(
    gameId: number,
    sinceDays: number,
    limit: number,
  ): Promise<TuneWithDetails[]> {
    const rows = await this.db.query<TuneWithDetailsRow>(
      `${BASE_SELECT}
       WHERE t.game_id = ?1
         AND t.created_at >= datetime('now', '-' || ?2 || ' days')
       ORDER BY COALESCE(sc.star_count, 0) DESC, t.created_at DESC
       LIMIT ?3`,
      [gameId, sinceDays, limit],
    );
    return rows.map(mapRowToTuneWithDetails);
  }

  async getByUser(
    userId: number,
    limit: number,
    offset: number,
    opts?: UserTunesQuery,
  ): Promise<TuneWithDetails[]> {
    const gameId = opts?.gameId;
    const sort = opts?.sort ?? DEFAULT_SORT;
    const orderClause = SORT_MAP[sort] ?? SORT_MAP[DEFAULT_SORT];
    const rows = await this.db.query<TuneWithDetailsRow>(
      `${BASE_SELECT} WHERE t.user_id = ?1 AND (?2 IS NULL OR t.game_id = ?2) ${orderClause} LIMIT ?3 OFFSET ?4`,
      [userId, gameId ?? null, limit, offset],
    );
    return rows.map(mapRowToTuneWithDetails);
  }

  async countByGame(gameId: number): Promise<number> {
    const result = await this.db.queryOne<{ total: number }>(
      "SELECT COUNT(*) AS total FROM tunes WHERE game_id = ?1",
      [gameId],
    );
    return result?.total ?? 0;
  }

  async countByUser(userId: number): Promise<number> {
    const result = await this.db.queryOne<{ total: number }>(
      "SELECT COUNT(*) AS total FROM tunes WHERE user_id = ?1",
      [userId],
    );
    return result?.total ?? 0;
  }

  async create(input: ValidatedTuneSubmission): Promise<number> {
    const car = await this.db.queryOne<{ game_id: number }>(
      `SELECT game_id FROM cars WHERE id = ?`,
      [input.carId],
    );
    if (!car || car.game_id !== input.gameId) {
      throw new Error("Car does not belong to the target game");
    }

    await this.db.execute(
      `INSERT INTO tunes
         (game_id, share_code, car_id, title, description,
          creator_gamertag, tune_type, pi_rating, car_class,
          drivetrain, track_name, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.gameId,
        input.shareCode,
        input.carId,
        input.title,
        input.description,
        input.creatorGamertag,
        input.tuneType,
        input.piRating,
        input.carClass,
        input.drivetrain,
        input.trackName,
        input.userId,
      ],
    );

    const row = await this.db.queryOne<TuneRow>(
      `SELECT id, game_id, share_code, car_id, title, description,
              creator_gamertag, tune_type, pi_rating, car_class,
              drivetrain, track_name,
              user_id, created_at, updated_at
       FROM tunes
       WHERE rowid = last_insert_rowid()`,
    );

    if (!row) {
      throw new Error("Failed to retrieve created tune");
    }

    await this.cacheVersions.bump();
    return mapRowToTune(row).id;
  }

  async update(
    id: number,
    userId: number,
    input: TuneUpdateInput,
  ): Promise<boolean> {
    const result = await this.db.execute(
      `UPDATE tunes SET
         title = ?,
         description = ?,
         tune_type = ?,
         creator_gamertag = ?,
         pi_rating = ?,
         car_class = ?,
         drivetrain = ?,
         track_name = ?,
         updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [
        input.title,
        input.description,
        input.tuneType,
        input.creatorGamertag,
        input.piRating,
        input.carClass,
        input.drivetrain,
        input.trackName,
        id,
        userId,
      ],
    );
    const changed = (result.meta?.changes ?? 0) > 0;
    if (changed) await this.cacheVersions.bump();
    return changed;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await this.db.execute(
      `DELETE FROM tunes WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    const changed = (result.meta?.changes ?? 0) > 0;
    if (changed) await this.cacheVersions.bump();
    return changed;
  }
}
