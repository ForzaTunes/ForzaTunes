import type { ReactElement } from "react";
import { OG_PALETTE } from "../OgTheme";
import { truncate } from "./OgPrimitives";

interface Props {
  creatorGamertag: string;
  gameName: string;
}

/**
 * Footer line for the tune OG card. Star count and PI now live in the
 * stacked top-right badges, so this only carries authorship + game.
 */
export function TuneOgFooter({ creatorGamertag, gameName }: Props): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        fontSize: 30,
        color: OG_PALETTE.muted,
      }}
    >
      <div
        style={{
          display: "flex",
          color: OG_PALETTE.textSubtle,
          fontWeight: 700,
        }}
      >
        by @{truncate(creatorGamertag, 24)}
      </div>
      <Bullet />
      <div style={{ display: "flex" }}>{gameName}</div>
    </div>
  );
}

function Bullet(): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        width: 6,
        height: 6,
        borderRadius: 999,
        background: OG_PALETTE.border,
      }}
    />
  );
}
