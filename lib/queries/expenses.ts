import { SupabaseClient } from "@supabase/supabase-js";
import { ExpenseFromFunction } from "@/lib/types";

/**
 * Get all expenses for a car (bypasses RLS using database function)
 * Includes fuel, insurance, services, and all other expense types
 */
export async function getCarExpenses(
  supabase: SupabaseClient,
  userId: string
): Promise<ExpenseFromFunction[]> {
  const { data, error } = await supabase.rpc("get_car_expenses", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }

  return (data || []) as ExpenseFromFunction[];
}

/**
 * Get only fuel expenses
 */
export async function getCarFuelExpenses(
  supabase: SupabaseClient,
  userId: string
): Promise<ExpenseFromFunction[]> {
  const expenses = await getCarExpenses(supabase, userId);
  return expenses.filter((e) => e.type.toLowerCase() === "fuel");
}
