import type { Car } from "../../models";

export interface CarFilters {
  make?: string;
  category?: string;
}

export interface ICarManager {
  getByGame(gameId: number, filters?: CarFilters): Promise<Car[]>;
  getById(id: number): Promise<Car | null>;
  getMakes(gameId: number): Promise<string[]>;
  getCategories(gameId: number): Promise<string[]>;
}
