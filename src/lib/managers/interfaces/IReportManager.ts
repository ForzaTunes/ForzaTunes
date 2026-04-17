import type { Report, ReportReason } from "../../models";

export interface IReportManager {
  create(
    tuneId: number,
    userId: number,
    reason: ReportReason,
    details?: string,
  ): Promise<Report>;
  hasUserReported(tuneId: number, userId: number): Promise<boolean>;
  getByTune(tuneId: number): Promise<Report[]>;
  countPending(): Promise<number>;
}
