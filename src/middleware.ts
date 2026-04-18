import { defineMiddleware } from "astro:middleware";
import type { APIContext, MiddlewareNext } from "astro";
import { env } from "cloudflare:workers";
import { SessionManager } from "./lib/auth/SessionManager";
import { createManagers } from "./lib/ManagerFactory";
import { ResponseCache } from "./lib/middleware/ResponseCache";

export const onRequest = defineMiddleware(async (context, next) => {
  const managers = createManagers(env);
  context.locals.managers = managers;

  const responseCache =
    env.DEMO_MODE === "true"
      ? null
      : new ResponseCache(managers.cacheVersions);

  if (responseCache) {
    const cached = await responseCache.tryServeFromCache(context.request);
    if (cached) return cached;
  }

  const response = await runAppRequest(context, next);

  if (!responseCache) return response;
  return responseCache.finalize(context.request, response);
});

async function runAppRequest(
  context: APIContext,
  next: MiddlewareNext,
): Promise<Response> {
  if (import.meta.env.DEV && env.DEV_AUTH_BYPASS === "true") {
    console.warn("[DEV] Auth bypass active — using mock user");
    context.locals.user = {
      id: 1,
      username: "DevUser",
      avatarUrl: null,
      forzaGamertag: "DevUser",
      bannedAt: null,
    };
    return next();
  }

  if (env.DEMO_MODE === "true") {
    context.locals.user = {
      id: 1,
      username: "DemoViewer",
      avatarUrl: null,
      forzaGamertag: "DemoViewer",
      bannedAt: null,
    };
    return next();
  }

  const sessionManager = new SessionManager(env.SESSION_SECRET);
  const cookieValue = context.cookies.get(SessionManager.COOKIE_NAME)?.value;

  if (cookieValue) {
    const session = await sessionManager.validateSession(cookieValue);
    if (session) {
      const userRow = await context.locals.managers.users.findById(
        session.userId,
      );

      if (userRow?.banned_at) {
        context.cookies.delete(SessionManager.COOKIE_NAME, { path: "/" });

        const isApiRequest = context.url.pathname.startsWith("/api/");
        if (isApiRequest) {
          return new Response(
            JSON.stringify({ error: "Account suspended" }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          );
        }
        return context.redirect("/banned");
      }

      if (userRow) {
        context.locals.user = {
          id: userRow.id,
          username: userRow.username,
          avatarUrl: userRow.avatar_url,
          forzaGamertag: userRow.forza_gamertag,
          bannedAt: null,
        };
      }
    }
  }

  return next();
}
