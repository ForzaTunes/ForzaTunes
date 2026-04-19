import type { ReactElement } from "react";
import type { TuneWithDetails } from "../../models";
import { OgTheme } from "../OgTheme";
import { OgCarBackdrop } from "./OgCarBackdrop";
import { OgCardFrame } from "./OgCardFrame";
import { OgInGamePill } from "./OgInGamePill";
import { OgLogo } from "./OgLogo";
import { OgStarBadge } from "./OgStarBadge";
import { TuneOgFooter } from "./TuneOgFooter";
import { TuneOgShareCode } from "./TuneOgShareCode";
import { TuneOgTitleBlock } from "./TuneOgTitleBlock";

interface Props {
  tune: TuneWithDetails;
  gameName: string;
  gameSlug: string;
  tuneTypeLabel: string;
  carImageDataUrl: string | null;
}

const PADDING = 56;
const CAR_WIDTH = 780;
const BADGE_SCALE = 1.35;
// Lifts the car so its wheels clear the bottom-right share code chip.
const CAR_VERTICAL_SHIFT = -30;

export function TuneOgCard({
  tune,
  gameName,
  gameSlug,
  tuneTypeLabel,
  carImageDataUrl,
}: Props): ReactElement {
  return (
    <OgCardFrame>
      {carImageDataUrl ? (
        <OgCarBackdrop
          imageUrl={carImageDataUrl}
          width={CAR_WIDTH}
          verticalShift={CAR_VERTICAL_SHIFT}
        />
      ) : null}
      <Foreground
        tune={tune}
        gameName={gameName}
        gameSlug={gameSlug}
        tuneTypeLabel={tuneTypeLabel}
      />
    </OgCardFrame>
  );
}

/**
 * All foreground elements are positioned absolutely so that variations in the
 * top-right badge stack height never shift the title block vertically.
 */
function Foreground({
  tune,
  gameName,
  gameSlug,
  tuneTypeLabel,
}: {
  tune: TuneWithDetails;
  gameName: string;
  gameSlug: string;
  tuneTypeLabel: string;
}): ReactElement {
  const theme = OgTheme.forGame(gameSlug);
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: PADDING,
          left: PADDING,
        }}
      >
        <OgLogo size="lg" accent={theme.accent500} />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          top: PADDING,
          right: PADDING,
          alignItems: "flex-end",
          gap: 14,
        }}
      >
        <OgInGamePill
          carClass={tune.carClass}
          piRating={tune.piRating}
          gameSlug={gameSlug}
          scale={BADGE_SCALE}
          flipped
        />
        <OgStarBadge count={tune.starCount} scale={BADGE_SCALE} />
      </div>

      <div
        style={{
          display: "flex",
          position: "absolute",
          left: PADDING,
          top: PADDING + 72 + 48,
        }}
      >
        <TuneOgTitleBlock
          title={tune.title}
          carYear={tune.carYear}
          carMake={tune.carMake}
          carModel={tune.carModel}
          tuneTypeLabel={tuneTypeLabel}
        />
      </div>

      <div
        style={{
          display: "flex",
          position: "absolute",
          left: PADDING,
          bottom: PADDING,
        }}
      >
        <TuneOgFooter
          creatorGamertag={tune.creatorGamertag}
          gameName={gameName}
        />
      </div>

      <div
        style={{
          display: "flex",
          position: "absolute",
          right: PADDING,
          bottom: PADDING,
        }}
      >
        <TuneOgShareCode shareCode={tune.shareCode} gameSlug={gameSlug} />
      </div>
    </div>
  );
}
