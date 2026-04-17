export type ReportReason = "inappropriate" | "spam" | "wrong_info" | "other";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam" },
  { value: "wrong_info", label: "Wrong information" },
  { value: "other", label: "Other" },
];

export type ReportStatus = "pending" | "reviewed" | "dismissed";

export interface Report {
  id: number;
  tuneId: number;
  reporterUserId: number;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
}
