import { Database } from "./database.types";

// Base types from database
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
export type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];

// Type from database function (includes payer name)
export type ExpenseFromFunction =
  Database["public"]["Functions"]["get_car_expenses"]["Returns"][number];

// Common expense types (for UI chips)
export const EXPENSE_TYPES = [
  "Fuel",
  "Insurance",
  "Service",
  "Parking",
  "Tax",
  "Registration",
  "Repairs",
  "Other",
] as const;

export type CommonExpenseType = (typeof EXPENSE_TYPES)[number];

// Minimal expense type for helper functions
type ExpenseForHelpers = Pick<Expense, "type" | "split_with">;

// Helper to check if expense is fuel (for balance calculations)
export function isFuelExpense(expense: ExpenseForHelpers): boolean {
  return expense.type.toLowerCase() === "fuel";
}

// Helper to get split member IDs (defaults to all active members for fuel)
export function getSplitMemberIds(
  expense: ExpenseForHelpers,
  allActiveMemberIds: string[]
): string[] {
  if (isFuelExpense(expense)) {
    // Fuel always splits among all active members
    return allActiveMemberIds;
  }
  // Other expenses use explicit split_with array
  return expense.split_with || [];
}
