import type { ReactElement } from "react";
import { OG_PALETTE, OgTheme } from "../OgTheme";
import { OgStarIcon } from "./OgStarIcon";

interface Props {
  count: number;
  scale?: number;
}

/**
 * Framed star count badge meant to stack under an {@link OgInGamePill}.
 * Height / border match the PI pill so the two align cleanly when stacked.
 */
export function OgStarBadge({ count, scale = 1 }: Props): ReactElement {
  const h = 56 * scale;
  const iconSize = 34 * scale;
  const fontSize = 26 * scale;
  const padX = 20 * scale;
  const gap = 12 * scale;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap,
        height: h,
        padding: `0 ${padX}px`,
        background: OG_PALETTE.surface,
        border: `2px solid ${OG_PALETTE.cardBorder}`,
        fontFamily: OgTheme.FONT_FAMILY,
      }}
    >
      <span
        style={{
          display: "flex",
          color: OG_PALETTE.text,
          fontWeight: 700,
          fontSize,
        }}
      >
        {count}
      </span>
      <OgStarIcon size={iconSize} color={OG_PALETTE.star} />
    </div>
  );
}
