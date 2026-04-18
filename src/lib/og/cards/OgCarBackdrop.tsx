import type { ReactElement } from "react";
import { OG_DIMENSIONS } from "../OgTheme";

interface Props {
  imageUrl: string;
  width: number;
}

/**
 * Renders the car image pinned to the right edge of the card, with a
 * left-to-right gradient that fades the car into the dark card background.
 *
 * We avoid the CSS `inset` shorthand because Satori does not support it —
 * explicit top/right/bottom/left are required.
 */
export function OgCarBackdrop({ imageUrl, width }: Props): ReactElement {
  const h = OG_DIMENSIONS.height;

  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        right: 0,
        top: 0,
        width,
        height: h,
      }}
    >
      <img
        src={imageUrl}
        width={width}
        height={h}
        style={{
          objectFit: "cover",
          width,
          height: h,
        }}
      />
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // Fade into the card's gray-900 background (#111827 = rgb(17,24,39)).
          background:
            "linear-gradient(to right, #111827 0%, #111827 8%, rgba(17,24,39,0.9) 22%, rgba(17,24,39,0.6) 40%, rgba(17,24,39,0.25) 65%, rgba(17,24,39,0) 100%)",
        }}
      />
    </div>
  );
}
