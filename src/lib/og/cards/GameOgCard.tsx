import type { ReactElement } from "react";
import { OG_PALETTE, OgTheme } from "../OgTheme";
import { OgCardFrame } from "./OgCardFrame";
import { OgLogo } from "./OgLogo";

interface Props {
  gameName: string;
  gameSlug: string;
  tuneCount: number;
  carCount: number;
  tagline: string;
}

export function GameOgCard({
  gameName,
  gameSlug,
  tuneCount,
  carCount,
  tagline,
}: Props): ReactElement {
  const theme = OgTheme.forGame(gameSlug);

  return (
    <OgCardFrame
      background={`radial-gradient(ellipse at top right, ${theme.accent900} 0%, ${OG_PALETTE.background} 55%)`}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: 72,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex" }}>
          <OgLogo size="lg" accent={theme.accent500} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 108,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -3,
              color: OG_PALETTE.text,
            }}
          >
            {gameName}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              color: OG_PALETTE.textSubtle,
              maxWidth: 980,
            }}
          >
            {tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 56,
            fontSize: 32,
          }}
        >
          <Stat value={tuneCount} label="tunes" accent={theme.accent500} />
          <Stat value={carCount} label="cars" accent={theme.accent500} />
          <div style={{ display: "flex", color: OG_PALETTE.muted, fontSize: 26 }}>
            forzatunes.com
          </div>
        </div>
      </div>
    </OgCardFrame>
  );
}

function Stat({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: string;
}): ReactElement {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          display: "flex",
          fontSize: 60,
          fontWeight: 700,
          color: accent,
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        {value.toLocaleString("en-US")}
      </div>
      <div
        style={{
          display: "flex",
          color: OG_PALETTE.textSubtle,
          fontSize: 32,
          lineHeight: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
}
