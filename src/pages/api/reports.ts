import type { APIRoute } from "astro";
import { OriginGuard } from "../../lib/auth/OriginGuard";
import { reportLimiter } from "../../lib/middleware/rateLimiters";
import { REPORT_REASONS, type ReportReason } from "../../lib/models";

const jsonHeaders = { "Content-Type": "application/json" };
const VALID_REASONS = new Set<string>(REPORT_REASONS.map((r) => r.value));

export const POST: APIRoute = async ({ locals, request }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: jsonHeaders },
    );
  }

  const originGuard = new OriginGuard();
  if (!originGuard.isSameOriginRequest(request)) {
    return new Response(
      JSON.stringify({ error: "Cross-origin requests are not allowed" }),
      { status: 403, headers: jsonHeaders },
    );
  }

  const clientIp = request.headers.get("cf-connecting-ip") ?? String(user.id);
  if (!(await reportLimiter.check(clientIp))) {
    return new Response(
      JSON.stringify({ error: "Too many reports. Try again later." }),
      { status: 429, headers: jsonHeaders },
    );
  }

  let body: { tuneId?: number; reason?: string; details?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const { tuneId, reason, details } = body;

  if (typeof tuneId !== "number" || !Number.isInteger(tuneId) || tuneId < 1) {
    return new Response(
      JSON.stringify({ error: "tuneId must be a positive integer" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  if (!reason || !VALID_REASONS.has(reason)) {
    return new Response(
      JSON.stringify({ error: "reason must be one of: inappropriate, spam, wrong_info, other" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  if (details && typeof details !== "string") {
    return new Response(
      JSON.stringify({ error: "details must be a string" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const { reports: reportManager } = locals.managers;

  const alreadyReported = await reportManager.hasUserReported(tuneId, user.id);
  if (alreadyReported) {
    return new Response(
      JSON.stringify({ error: "You have already reported this tune" }),
      { status: 409, headers: jsonHeaders },
    );
  }

  try {
    await reportManager.create(tuneId, user.id, reason as ReportReason, details);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 201, headers: jsonHeaders },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to submit report" }),
      { status: 500, headers: jsonHeaders },
    );
  }
};
