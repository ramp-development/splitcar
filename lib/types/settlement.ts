import { Database } from "./database.types";

// Base types from database
export type Settlement = Database["public"]["Tables"]["settlements"]["Row"];
export type SettlementInsert = Database["public"]["Tables"]["settlements"]["Insert"];
export type SettlementUpdate = Database["public"]["Tables"]["settlements"]["Update"];

// Extended type with member names (from database function)
export type SettlementWithNames = Settlement & {
  from_member_name: string;
  to_member_name: string;
};

// Database function return type
export type SettlementFromFunction =
  Database["public"]["Functions"]["get_car_settlements"]["Returns"][number];
