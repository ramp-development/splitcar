import { Database } from "./database.types";
import { Car } from "./car";

// Base types from database
export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
export type TripUpdate = Database["public"]["Tables"]["trips"]["Update"];

// Extended type with calculated cost
export type TripWithCost = Trip & {
  totalCost: number;
  costPerPassenger: number;
};

// Helper functions
export function calculateTripCost(trip: Trip, costPerKm: number): number {
  return trip.distance_km * costPerKm;
}

export function calculateCostPerPassenger(
  trip: Trip,
  costPerKm: number
): number {
  const totalCost = calculateTripCost(trip, costPerKm);
  return totalCost / trip.passenger_member_ids.length;
}

export function getTripWithCost(trip: Trip, car: Car): TripWithCost {
  const costPerKm = car.avg_price_per_litre / car.efficiency_km_per_litre;
  const totalCost = calculateTripCost(trip, costPerKm);
  const costPerPassenger = calculateCostPerPassenger(trip, costPerKm);

  return {
    ...trip,
    totalCost,
    costPerPassenger,
  };
}

// Check if member is a passenger
export function isMemberPassenger(trip: Trip, memberId: string): boolean {
  return trip.passenger_member_ids.includes(memberId);
}
