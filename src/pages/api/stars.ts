import type { APIRoute } from "astro";
import { OriginGuard } from "../../lib/auth/OriginGuard";
import { starLimiter } from "../../lib/middleware/rateLimiters";

const jsonHeaders = { "Content-Type": "application/json" };

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
  if (!(await starLimiter.check(clientIp))) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Try again shortly." }),
      { status: 429, headers: jsonHeaders },
    );
  }

  let body: { tuneId?: number };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const { tuneId } = body;
  if (typeof tuneId !== "number" || !Number.isInteger(tuneId) || tuneId < 1) {
    return new Response(
      JSON.stringify({ error: "tuneId must be a positive integer" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const { stars: starManager } = locals.managers;

  try {
    const starred = await starManager.toggleStar(user.id, tuneId);
    const starCount = await starManager.getStarCount(tuneId);

    return new Response(
      JSON.stringify({ starred, starCount }),
      { status: 200, headers: jsonHeaders },
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to toggle star" }),
      { status: 500, headers: jsonHeaders },
    );
  }
};
