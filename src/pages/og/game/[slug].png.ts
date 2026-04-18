import type { APIRoute } from "astro";
import { OgCardRenderer } from "../../../lib/og/OgCardRenderer";
import { OgCacheManager } from "../../../lib/og/OgCacheManager";
import { GameOgCard } from "../../../lib/og/cards/GameOgCard";

const TAGLINES: Record<string, string> = {
  fh5: "Tunes by the Forza Horizon 5 community.",
  fm: "Tunes by the Forza Motorsport community.",
  fh6: "Tunes by the Forza Horizon 6 community.",
};

export const GET: APIRoute = async ({ params, locals, request }) => {
  const gameSlug = params.slug;
  if (!gameSlug) return OgCacheManager.notFound("missing slug");

  const { games, tunes, cars } = locals.managers;
  const game = await games.getBySlug(gameSlug);
  if (!game) return OgCacheManager.notFound("game not found");

  const [tuneCount, carsForGame] = await Promise.all([
    tunes.countByGame(game.id),
    cars.getByGame(game.id),
  ]);

  const renderer = await OgCardRenderer.create(request);
  const response = renderer.render(
    GameOgCard({
      gameName: game.name,
      gameSlug,
      tuneCount,
      carCount: carsForGame.length,
      tagline: TAGLINES[gameSlug] ?? `Tunes by the ${game.name} community.`,
    }),
  );

  return OgCacheManager.applyTo(response);
};
