import type { APIRoute } from "astro";
import { OgCardRenderer } from "../../../../lib/og/OgCardRenderer";
import { OgCacheManager } from "../../../../lib/og/OgCacheManager";
import { TuneOgCard } from "../../../../lib/og/cards/TuneOgCard";

function parseId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export const GET: APIRoute = async ({ params, locals }) => {
  const tuneId = parseId(params.id);
  const gameSlug = params.game;
  if (tuneId === null || !gameSlug) {
    return OgCacheManager.notFound("invalid params");
  }

  const { tunes, games } = locals.managers;
  const [tune, game] = await Promise.all([
    tunes.getById(tuneId),
    games.getBySlug(gameSlug),
  ]);

  if (!tune || !game || tune.gameId !== game.id) {
    return OgCacheManager.notFound("tune not found");
  }

  const config = games.getConfig(gameSlug);
  const tuneTypeLabel =
    config?.tuneTypes.find((t) => t.value === tune.tuneType)?.label ??
    tune.tuneType;

  const renderer = await OgCardRenderer.create();
  const response = renderer.render(
    TuneOgCard({
      tune,
      gameName: game.name,
      gameSlug,
      tuneTypeLabel,
    }),
  );

  return OgCacheManager.applyTo(response);
};
