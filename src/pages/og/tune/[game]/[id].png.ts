import type { APIRoute } from "astro";
import { OgCardRenderer } from "../../../../lib/og/OgCardRenderer";
import { OgCacheManager } from "../../../../lib/og/OgCacheManager";
import { OgImageLoader } from "../../../../lib/og/OgImageLoader";
import { TuneOgCard } from "../../../../lib/og/cards/TuneOgCard";

function parseId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return null;
  return id;
}

export const GET: APIRoute = async ({ request, params, locals }) => {
  const tuneId = parseId(params.id);
  const gameSlug = params.game;
  if (tuneId === null || !gameSlug) {
    return OgCacheManager.notFound("invalid params");
  }

  const cached = await OgCacheManager.tryServe(request);
  if (cached) return cached;

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

  const [renderer, carImageDataUrl] = await Promise.all([
    OgCardRenderer.create(),
    OgImageLoader.loadCarDataUrl({
      imageKey: tune.carImageKey,
      imageUrl: tune.carImageUrl,
    }),
  ]);

  const response = renderer.render(
    TuneOgCard({
      tune,
      gameName: game.name,
      gameSlug,
      tuneTypeLabel,
      carImageDataUrl,
    }),
  );

  return OgCacheManager.store(request, response);
};
