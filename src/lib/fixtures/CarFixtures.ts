import type { Car } from "../models";
import fh5Cars from "../../data/cars/fh5.json";
import fmCars from "../../data/cars/fm.json";
import fh6Cars from "../../data/cars/fh6.json";

interface RawCar {
  make: string;
  model: string;
  year: number;
  category: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
}

interface GameCars {
  gameId: number;
  slug: string;
  cars: RawCar[];
}

const SOURCES: GameCars[] = [
  { gameId: 1, slug: "fh5", cars: fh5Cars as RawCar[] },
  { gameId: 2, slug: "fm", cars: fmCars as RawCar[] },
  { gameId: 3, slug: "fh6", cars: fh6Cars as RawCar[] },
];

function buildCars(): Car[] {
  const out: Car[] = [];
  for (const source of SOURCES) {
    const base = source.gameId * 100_000;
    source.cars.forEach((raw, index) => {
      out.push({
        id: base + index + 1,
        gameId: source.gameId,
        make: raw.make,
        model: raw.model,
        year: raw.year,
        category: raw.category ?? null,
        imageUrl: raw.imageUrl ?? null,
        imageKey: raw.imageKey ?? null,
      });
    });
  }
  return out;
}

export const DEMO_CARS: Car[] = buildCars();

export function demoCarsForGame(gameId: number): Car[] {
  return DEMO_CARS.filter((c) => c.gameId === gameId);
}
