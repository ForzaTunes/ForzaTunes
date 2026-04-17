import type { Report, ReportReason } from "../../models";
import type { IReportManager } from "../interfaces";
import { DemoStore } from "./DemoStore";

export class DemoReportManager implements IReportManager {
  constructor(private store: DemoStore) {}

  async create(
    tuneId: number,
    userId: number,
    reason: ReportReason,
    details?: string,
  ): Promise<Report> {
    const report: Report = {
      id: this.store.allocateReportId(),
      tuneId,
      reporterUserId: userId,
      reason,
      details: details?.slice(0, 500) ?? null,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.store.reports.push(report);
    return report;
  }

  async hasUserReported(tuneId: number, userId: number): Promise<boolean> {
    return this.store.reports.some(
      (r) => r.tuneId === tuneId && r.reporterUserId === userId,
    );
  }

  async getByTune(tuneId: number): Promise<Report[]> {
    return this.store.reports
      .filter((r) => r.tuneId === tuneId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async countPending(): Promise<number> {
    return this.store.reports.filter((r) => r.status === "pending").length;
  }
}
