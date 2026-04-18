import type { ReactElement } from "react";
import { OG_PALETTE } from "../OgTheme";
import { truncate } from "./OgPrimitives";

interface Props {
  title: string;
  carYear: number;
  carMake: string;
  carModel: string;
  tuneTypeLabel: string;
}

export function TuneOgTitleBlock({
  title,
  carYear,
  carMake,
  carModel,
  tuneTypeLabel,
}: Props): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 22,
        maxWidth: 680,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 78,
          fontWeight: 700,
          lineHeight: 1.02,
          letterSpacing: -2,
          color: OG_PALETTE.text,
        }}
      >
        {truncate(title, 48)}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 34,
          color: OG_PALETTE.textSubtle,
        }}
      >
        {carYear} {carMake} {carModel}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <TuneTypeChip label={tuneTypeLabel} />
      </div>
    </div>
  );
}

function TuneTypeChip({ label }: { label: string }): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 64,
        padding: "0 28px",
        fontSize: 28,
        fontWeight: 700,
        color: "#6ee7b7",
        background: "rgba(5,46,22,0.65)",
        border: "2px solid #065f46",
      }}
    >
      {label}
    </div>
  );
}
