import type { ClassRange } from "../../lib/models";

export function classFromPi(
  classRanges: ClassRange[],
  piRating: number,
): string | null {
  if (!Number.isFinite(piRating)) return null;
  const match = classRanges.find(
    (range) => piRating >= range.min && piRating <= range.max,
  );
  return match?.class ?? null;
}
