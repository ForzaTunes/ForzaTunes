import type { ReactElement } from "react";
import { OG_PALETTE } from "../OgTheme";

interface PillProps {
  label: string;
  background: string;
  color: string;
  borderColor?: string;
  fontSize?: number;
}

export function OgPill({
  label,
  background,
  color,
  borderColor,
  fontSize = 22,
}: PillProps): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 18px",
        borderRadius: 999,
        background,
        color,
        fontSize,
        fontWeight: 700,
        border: borderColor ? `2px solid ${borderColor}` : "none",
      }}
    >
      {label}
    </div>
  );
}

export function OgDot({
  color = OG_PALETTE.border,
  size = 6,
}: { color?: string; size?: number } = {}): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
      }}
    />
  );
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}
