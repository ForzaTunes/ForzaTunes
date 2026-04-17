import type { APIRoute } from "astro";
import { GamertagValidator } from "../../lib/validators/GamertagValidator";
import { OriginGuard } from "../../lib/auth/OriginGuard";

const jsonHeaders = { "Content-Type": "application/json" };

export const PATCH: APIRoute = async ({ locals, request }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const originGuard = new OriginGuard();
  if (!originGuard.isSameOriginRequest(request)) {
    return new Response(
      JSON.stringify({ error: "Cross-origin requests are not allowed" }),
      { status: 403, headers: jsonHeaders },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const validator = new GamertagValidator();
  const result = validator.validate(body.forzaGamertag);
  if (!result.valid || !result.normalized) {
    return new Response(
      JSON.stringify({ error: result.error ?? "Invalid gamertag" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const { users: userManager } = locals.managers;
  await userManager.updateForzaGamertag(user.id, result.normalized);

  return new Response(
    JSON.stringify({ success: true, forzaGamertag: result.normalized }),
    { status: 200, headers: jsonHeaders },
  );
};
