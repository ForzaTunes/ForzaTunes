import type { CSSProperties, ReactElement, ReactNode } from "react";
import { OG_DIMENSIONS, OG_PALETTE, OgTheme } from "../OgTheme";

interface Props {
  children: ReactNode;
  background?: CSSProperties["background"];
}

/**
 * Shared outer shell for every OG card: fixed 1200x630 dimensions, dark card
 * surface, and a 1px inset border styled to match the site's `border-gray-700`
 * on TuneCard / GameHome tiles. Children render inside the frame and can
 * position themselves absolutely.
 */
export function OgCardFrame({ children, background }: Props): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: OG_DIMENSIONS.width,
        height: OG_DIMENSIONS.height,
        background: background ?? OG_PALETTE.background,
        color: OG_PALETTE.text,
        fontFamily: OgTheme.FONT_FAMILY,
      }}
    >
      {children}
      <BorderOverlay />
    </div>
  );
}

function BorderOverlay(): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        border: `1px solid ${OG_PALETTE.cardBorder}`,
        pointerEvents: "none",
      }}
    />
  );
}
