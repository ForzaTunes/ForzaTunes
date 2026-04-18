import type { ReactElement } from "react";
import { OG_PALETTE, OgTheme } from "../OgTheme";

interface Props {
  size?: "sm" | "md" | "lg";
  /**
   * Color applied to the "TUNES" half of the wordmark and the "T" letter in
   * the badge. Defaults to the brand pink when no game context is supplied.
   */
  accent?: string;
}

const SIZES = {
  sm: { badge: 40, font: 22, wordmark: 24, gap: 12, radius: 8 },
  md: { badge: 56, font: 32, wordmark: 32, gap: 14, radius: 10 },
  lg: { badge: 72, font: 42, wordmark: 40, gap: 18, radius: 12 },
} as const;

export function OgLogo({ size = "md", accent }: Props): ReactElement {
  const s = SIZES[size];
  const tintColor = accent ?? OgTheme.LOGO_ACCENT;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: s.gap,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: s.badge,
          height: s.badge,
          borderRadius: s.radius,
          background: OgTheme.LOGO_BG,
          fontFamily: OgTheme.FONT_FAMILY,
          fontWeight: 800,
          fontStyle: "italic",
          fontSize: s.font,
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        <span style={{ color: OG_PALETTE.text }}>F</span>
        <span style={{ color: tintColor }}>T</span>
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: OgTheme.FONT_FAMILY,
          fontWeight: 800,
          fontStyle: "italic",
          fontSize: s.wordmark,
          letterSpacing: -0.5,
        }}
      >
        <span style={{ color: OG_PALETTE.text }}>FORZA</span>
        <span style={{ color: tintColor }}>TUNES</span>
      </div>
    </div>
  );
}
