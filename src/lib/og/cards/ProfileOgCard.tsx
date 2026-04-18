import type { ReactElement } from "react";
import { OG_PALETTE, OgTheme, type OgGameTheme } from "../OgTheme";
import { OgCardFrame } from "./OgCardFrame";
import { OgLogo } from "./OgLogo";
import { truncate } from "./OgPrimitives";

interface Props {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  tuneCount: number;
  totalStars: number;
  favouriteGameShortName: string | null;
  favouriteGameSlug: string | null;
}

export function ProfileOgCard({
  displayName,
  username,
  avatarUrl,
  tuneCount,
  totalStars,
  favouriteGameShortName,
  favouriteGameSlug,
}: Props): ReactElement {
  const theme = OgTheme.forGame(favouriteGameSlug);

  return (
    <OgCardFrame
      background={`radial-gradient(ellipse at bottom left, ${theme.accent900} 0%, ${OG_PALETTE.background} 60%)`}
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
        <OgLogo size="lg" accent={theme.accent500} />

        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <Avatar avatarUrl={avatarUrl} accent={theme.accent500} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                fontSize: 84,
                fontWeight: 700,
                letterSpacing: -2,
                lineHeight: 1,
                color: OG_PALETTE.text,
              }}
            >
              {truncate(displayName, 22)}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 34,
                color: OG_PALETTE.textSubtle,
              }}
            >
              @{truncate(username, 28)}
            </div>
          </div>
        </div>

        <Stats
          tuneCount={tuneCount}
          totalStars={totalStars}
          favouriteGameShortName={favouriteGameShortName}
          theme={theme}
        />
      </div>
    </OgCardFrame>
  );
}

function Avatar({
  avatarUrl,
  accent,
}: {
  avatarUrl: string | null;
  accent: string;
}): ReactElement {
  const size = 208;
  const radius = 0;
  if (!avatarUrl) {
    return (
      <div
        style={{
          display: "flex",
          width: size,
          height: size,
          borderRadius: radius,
          background: accent,
          border: `4px solid ${OG_PALETTE.cardBorder}`,
        }}
      />
    );
  }
  return (
    <img
      src={avatarUrl}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        border: `4px solid ${OG_PALETTE.cardBorder}`,
      }}
    />
  );
}

function Stats({
  tuneCount,
  totalStars,
  favouriteGameShortName,
  theme,
}: {
  tuneCount: number;
  totalStars: number;
  favouriteGameShortName: string | null;
  theme: OgGameTheme;
}): ReactElement {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 70, fontSize: 32 }}>
      <StatItem value={tuneCount} label="tunes shared" accent={theme.accent500} />
      <StatItem
        value={totalStars}
        label={totalStars === 1 ? "star earned" : "stars earned"}
        accent={OG_PALETTE.star}
      />
      {favouriteGameShortName && (
        <div style={{ display: "flex", color: OG_PALETTE.textSubtle }}>
          Mostly {favouriteGameShortName}
        </div>
      )}
    </div>
  );
}

function StatItem({
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
          fontSize: 56,
          fontWeight: 700,
          color: accent,
          lineHeight: 1,
        }}
      >
        {value.toLocaleString("en-US")}
      </div>
      <div
        style={{
          display: "flex",
          color: OG_PALETTE.textSubtle,
          fontSize: 30,
          lineHeight: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
}
