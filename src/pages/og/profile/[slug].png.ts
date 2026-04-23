import type { APIRoute } from "astro";
import { OgCardRenderer } from "../../../lib/og/OgCardRenderer";
import { OgCacheManager } from "../../../lib/og/OgCacheManager";
import { ProfileOgCard } from "../../../lib/og/cards/ProfileOgCard";
import { ProfileFavouriteGameResolver } from "../../../lib/og/ProfileFavouriteGameResolver";

/**
 * Validates the opaque public slug used in profile URLs. Rejects numeric
 * and gamertag-alias shapes so the OG endpoint never leaks iteration data
 * or attempts gamertag resolution (profile pages always emit canonical
 * slugs into OG metadata).
 */
function isValidSlug(raw: string | undefined): raw is string {
  if (!raw) return false;
  if (/^\d+$/.test(raw)) return false;
  return /^[A-Za-z0-9]{8,32}$/.test(raw);
}

export const GET: APIRoute = async ({ request, params, locals }) => {
  const slug = params.slug;
  if (!isValidSlug(slug)) return OgCacheManager.notFound("invalid slug");

  const cached = await OgCacheManager.tryServe(request);
  if (cached) return cached;

  const { users, tunes, stars, games } = locals.managers;
  const userRow = await users.findByPublicSlug(slug);
  if (!userRow) return OgCacheManager.notFound("profile not found");

  const [tuneCount, totalStars, favourite] = await Promise.all([
    tunes.countByUser(userRow.id),
    stars.countReceivedByUser(userRow.id),
    ProfileFavouriteGameResolver.resolve(userRow.id, tunes, games),
  ]);

  const displayName = userRow.forza_gamertag ?? userRow.username;

  const renderer = await OgCardRenderer.create();
  const response = renderer.render(
    ProfileOgCard({
      displayName,
      username: userRow.username,
      avatarUrl: userRow.avatar_url,
      tuneCount,
      totalStars,
      favouriteGameShortName: favourite?.shortName ?? null,
      favouriteGameSlug: favourite?.slug ?? null,
    }),
  );

  return OgCacheManager.store(request, response);
};
