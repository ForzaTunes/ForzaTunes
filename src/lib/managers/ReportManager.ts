import type { DatabaseClient } from "../db/DatabaseClient";
import type { Report, ReportReason } from "../models";
import type { IReportManager } from "./interfaces";

interface ReportRow {
  id: number;
  tune_id: number;
  reporter_user_id: number;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

function mapRowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    tuneId: row.tune_id,
    reporterUserId: row.reporter_user_id,
    reason: row.reason as ReportReason,
    details: row.details,
    status: row.status as Report["status"],
    createdAt: row.created_at,
  };
}

export class ReportManager implements IReportManager {
  constructor(private db: DatabaseClient) {}

  async create(
    tuneId: number,
    userId: number,
    reason: ReportReason,
    details?: string,
  ): Promise<Report> {
    await this.db.execute(
      `INSERT INTO reports (tune_id, reporter_user_id, reason, details) VALUES (?, ?, ?, ?)`,
      [tuneId, userId, reason, details?.slice(0, 500) ?? null],
    );

    const row = await this.db.queryOne<ReportRow>(
      `SELECT id, tune_id, reporter_user_id, reason, details, status, created_at
       FROM reports WHERE rowid = last_insert_rowid()`,
    );

    if (!row) throw new Error("Failed to retrieve created report");
    return mapRowToReport(row);
  }

  async hasUserReported(tuneId: number, userId: number): Promise<boolean> {
    const row = await this.db.queryOne<{ id: number }>(
      `SELECT id FROM reports WHERE tune_id = ? AND reporter_user_id = ?`,
      [tuneId, userId],
    );
    return row !== null;
  }

  async getByTune(tuneId: number): Promise<Report[]> {
    const rows = await this.db.query<ReportRow>(
      `SELECT id, tune_id, reporter_user_id, reason, details, status, created_at
       FROM reports WHERE tune_id = ? ORDER BY created_at DESC`,
      [tuneId],
    );
    return rows.map(mapRowToReport);
  }

  async countPending(): Promise<number> {
    const result = await this.db.queryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM reports WHERE status = 'pending'`,
    );
    return result?.total ?? 0;
  }
}
