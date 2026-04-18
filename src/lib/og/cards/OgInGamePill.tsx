import type { ReactElement } from "react";
import { OG_PALETTE, OgTheme } from "../OgTheme";

interface Props {
  carClass: string;
  piRating: number;
  gameSlug: string;
  scale?: number;
  flipped?: boolean;
}

/**
 * OG version of {@link import("../../../components/submit/InGameClassPill").default}:
 * two-part pill (class letter on class color, PI number on dark) with a gray
 * border and inner divider. When `flipped`, the PI number renders first and
 * the class letter second, matching the site's `flipped` prop.
 */
export function OgInGamePill({
  carClass,
  piRating,
  gameSlug,
  scale = 1,
  flipped = false,
}: Props): ReactElement {
  const classBg = OgTheme.classColor(gameSlug, carClass);
  const h = 56 * scale;
  const letterW = 60 * scale;
  const numberW = 96 * scale;
  const fontSize = 28 * scale;

  const letterBox = (
    <div
      key="letter"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: letterW,
        height: h,
        background: classBg,
        fontSize,
        textTransform: "uppercase",
      }}
    >
      {carClass}
    </div>
  );

  const numberBox = (
    <div
      key="number"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: numberW,
        height: h,
        background: OG_PALETTE.surface,
        fontSize: fontSize * 0.85,
      }}
    >
      {piRating}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        height: h,
        fontFamily: OgTheme.FONT_FAMILY,
        fontWeight: 700,
        color: "#ffffff",
        border: `2px solid ${OG_PALETTE.cardBorder}`,
        overflow: "hidden",
      }}
    >
      {flipped ? numberBox : letterBox}
      {flipped ? letterBox : numberBox}
    </div>
  );
}
