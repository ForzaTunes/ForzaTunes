import type { APIRoute } from "astro";
import { CarClassResolver } from "../../../lib/managers/CarClassResolver";
import { TuneValidator } from "../../../lib/validators/TuneValidator";
import { contentFilter } from "../../../lib/validators/contentFilterInstance";
import { OriginGuard } from "../../../lib/auth/OriginGuard";

const jsonHeaders = { "Content-Type": "application/json" };

function parseId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export const PATCH: APIRoute = async ({ locals, params, request }) => {
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

  const id = parseId(params.id);
  if (id === null) {
    return new Response(
      JSON.stringify({ error: "Invalid tune id" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const { tunes: tuneManager, games: gameManager } = locals.managers;
  const existing = await tuneManager.getById(id);

  if (!existing) {
    return new Response(
      JSON.stringify({ error: "Tune not found" }),
      { status: 404, headers: jsonHeaders },
    );
  }
  if (existing.userId !== user.id) {
    return new Response(
      JSON.stringify({ error: "You can only edit your own tunes" }),
      { status: 403, headers: jsonHeaders },
    );
  }

  const game = await gameManager.getById(existing.gameId);
  const gameConfig = game ? gameManager.getConfig(game.slug) : null;

  if (!gameConfig) {
    return new Response(
      JSON.stringify({ error: "Unknown game config for tune" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  const validator = new TuneValidator();
  const submission = {
    shareCode: existing.shareCode,
    carId: existing.carId,
    title: typeof body.title === "string" ? body.title : existing.title,
    description:
      typeof body.description === "string"
        ? body.description
        : existing.description ?? "",
    tuneType:
      typeof body.tuneType === "string" ? body.tuneType : existing.tuneType,
    piRating:
      typeof body.piRating === "number" ? body.piRating : existing.piRating,
    drivetrain:
      typeof body.drivetrain === "string"
        ? body.drivetrain
        : (existing.drivetrain ?? undefined),
    trackName:
      typeof body.trackName === "string"
        ? body.trackName
        : (existing.trackName ?? undefined),
  };

  const result = validator.validate(submission, gameConfig);
  if (!result.valid) {
    return new Response(
      JSON.stringify({ error: result.errors.join(", ") }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const contentCheck = contentFilter.checkMultiple([
    submission.title,
    submission.description ?? "",
    result.normalized?.trackName ?? "",
  ]);
  if (!contentCheck.clean) {
    return new Response(
      JSON.stringify({ error: "Submission contains inappropriate language." }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const derivedClass = CarClassResolver.resolveFromConfig(
    gameConfig,
    submission.piRating,
  );

  const updated = await tuneManager.update(id, user.id, {
    title: submission.title.trim(),
    description: submission.description.trim() || null,
    tuneType: submission.tuneType,
    creatorGamertag: existing.creatorGamertag,
    piRating: submission.piRating,
    carClass: derivedClass,
    drivetrain: result.normalized?.drivetrain ?? null,
    trackName: result.normalized?.trackName ?? null,
  });

  if (!updated) {
    return new Response(
      JSON.stringify({ error: "Update failed" }),
      { status: 500, headers: jsonHeaders },
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: jsonHeaders },
  );
};

export const DELETE: APIRoute = async ({ locals, params, request }) => {
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

  const id = parseId(params.id);
  if (id === null) {
    return new Response(
      JSON.stringify({ error: "Invalid tune id" }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const { tunes: tuneManager } = locals.managers;
  const deleted = await tuneManager.delete(id, user.id);

  if (!deleted) {
    return new Response(
      JSON.stringify({ error: "Tune not found or not owned by you" }),
      { status: 404, headers: jsonHeaders },
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: jsonHeaders },
  );
};
