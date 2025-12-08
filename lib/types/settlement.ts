import { Database } from "./database.types";

// Base types from database
export type Settlement = Database["public"]["Tables"]["settlements"]["Row"];
export type SettlementInsert =
  Database["public"]["Tables"]["settlements"]["Insert"];
export type SettlementUpdate =
  Database["public"]["Tables"]["settlements"]["Update"];
export type SettlementStatus = Database["public"]["Enums"]["settlement_status"];

// Helper functions
export function isSettlementPending(settlement: Settlement): boolean {
  return settlement.status === "pending";
}

export function isSettlementSettled(settlement: Settlement): boolean {
  return settlement.status === "settled";
}
