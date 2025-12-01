import { Database } from "./database.types";

// Base types from database
export type Car = Database["public"]["Tables"]["cars"]["Row"];
export type CarInsert = Database["public"]["Tables"]["cars"]["Insert"];
export type CarUpdate = Database["public"]["Tables"]["cars"]["Update"];

// Extended types with computed properties
export type CarWithMetrics = Car & {
  costPerKm: number;
};

// Helper functions
export function calculateCostPerKm(car: Car): number {
  return car.avg_price_per_litre / car.efficiency_km_per_litre;
}

export function getCarWithMetrics(car: Car): CarWithMetrics {
  return {
    ...car,
    costPerKm: calculateCostPerKm(car),
  };
}
