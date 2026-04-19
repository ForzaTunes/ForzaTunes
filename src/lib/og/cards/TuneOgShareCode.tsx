import type { ReactElement } from "react";
import { OG_PALETTE, OgTheme } from "../OgTheme";

interface Props {
  shareCode: string;
  gameSlug: string;
}

/**
 * Renders the tune's share code in a chip styled to match the site's
 * `ShareCodeCopy` component (mono, tracked, accent on dark surface). Anchored
 * bottom-right of the tune OG card so anyone seeing the preview can read the
 * code without visiting the page.
 */
export function TuneOgShareCode({ shareCode, gameSlug }: Props): ReactElement {
  const theme = OgTheme.forGame(gameSlug);
  const formatted = formatShareCode(shareCode);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {/* <div
        style={{
          display: "flex",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: OG_PALETTE.muted,
        }}
      >
        Share Code
      </div> */}
      <div
        style={{
          display: "flex",
          fontSize: 42,
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: theme.accent300,
          background: OG_PALETTE.surfaceElevated,
          padding: "12px 24px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatted}
      </div>
    </div>
  );
}

function formatShareCode(raw: string): string {
  return raw
    .replace(/\D/g, "")
    .replace(/(.{3})/g, "$1 ")
    .trim();
}
