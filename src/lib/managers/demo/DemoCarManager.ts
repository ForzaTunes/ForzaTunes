import type { Car } from "../../models";
import type { CarFilters, ICarManager } from "../interfaces";
import { DEMO_CARS, demoCarsForGame } from "../../fixtures/CarFixtures";

export class DemoCarManager implements ICarManager {
  async getByGame(gameId: number, filters?: CarFilters): Promise<Car[]> {
    return demoCarsForGame(gameId)
      .filter((c) => !filters?.make || c.make === filters.make)
      .filter((c) => !filters?.category || c.category === filters.category)
      .slice()
      .sort((a, b) => {
        if (a.make !== b.make) return a.make.localeCompare(b.make);
        return a.model.localeCompare(b.model);
      });
  }

  async getById(id: number): Promise<Car | null> {
    return DEMO_CARS.find((c) => c.id === id) ?? null;
  }

  async getMakes(gameId: number): Promise<string[]> {
    const makes = new Set(demoCarsForGame(gameId).map((c) => c.make));
    return [...makes].sort();
  }

  async getCategories(gameId: number): Promise<string[]> {
    const categories = new Set<string>();
    for (const car of demoCarsForGame(gameId)) {
      if (car.category) categories.add(car.category);
    }
    return [...categories].sort();
  }
}
