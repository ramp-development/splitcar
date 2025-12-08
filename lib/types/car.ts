import { Database } from "./database.types";

// Base types from database
export type Car = Database["public"]["Tables"]["cars"]["Row"];
export type CarInsert = Database["public"]["Tables"]["cars"]["Insert"];
export type CarUpdate = Database["public"]["Tables"]["cars"]["Update"];

// Extended types with computed properties
export type CarWithMetrics = Car & {
  costPerKm: number;
};

/**
 * Calculate cost per km based on fuel efficiency and price
 * All calculations use metric (km, litres)
 */
export function calculateCostPerKm(car: Car): number {
  if (!car.km_per_litre || !car.default_price_per_litre) {
    return 0;
  }
  return car.default_price_per_litre / car.km_per_litre;
}

export function getCarWithMetrics(car: Car): CarWithMetrics {
  return {
    ...car,
    costPerKm: calculateCostPerKm(car),
  };
}
