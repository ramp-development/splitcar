import { Database } from "./database.types";
import { Car } from "./car";

// Base types from database
export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
export type TripUpdate = Database["public"]["Tables"]["trips"]["Update"];

// Type from database function
export type TripFromFunction =
  Database["public"]["Functions"]["get_car_trips"]["Returns"][number];

// Extended type with calculated cost
export type TripWithCost = Trip & {
  totalCost: number;
  costPerPassenger: number;
};

// Helper functions
export function calculateTripCost(trip: Trip, costPerKm: number): number {
  return trip.distance * costPerKm;
}

export function calculateCostPerPassenger(
  trip: Trip,
  costPerKm: number
): number {
  const totalCost = calculateTripCost(trip, costPerKm);
  return trip.passengers.length > 0 ? totalCost / trip.passengers.length : 0;
}

export function getTripWithCost(trip: Trip, car: Car): TripWithCost {
  if (!car.km_per_litre || !car.default_price_per_litre) {
    return {
      ...trip,
      totalCost: 0,
      costPerPassenger: 0,
    };
  }

  const costPerKm = car.default_price_per_litre / car.km_per_litre;
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
  return trip.passengers.includes(memberId);
}
