import { Database } from "./database.types";

// Base types from database
export type FuelFill = Database["public"]["Tables"]["fuel_fills"]["Row"];
export type FuelFillInsert = Database["public"]["Tables"]["fuel_fills"]["Insert"];
export type FuelFillUpdate = Database["public"]["Tables"]["fuel_fills"]["Update"];

// Extended type with payer name (from database function)
export type FuelFillWithPayer = FuelFill & {
  payer_name: string;
};

// Database function return type
export type FuelFillFromFunction =
  Database["public"]["Functions"]["get_car_fuel_fills"]["Returns"][number];
