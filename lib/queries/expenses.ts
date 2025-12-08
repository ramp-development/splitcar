import { SupabaseClient } from "@supabase/supabase-js";
import { Expense, ExpenseInsert, ExpenseUpdate } from "@/lib/types";

/**
 * Expense with payer name joined
 */
export type ExpenseWithPayer = Expense & {
  payer_name: string | null;
};

/**
 * Get all expenses for a car that the user has access to
 * Includes fuel, insurance, services, and all other expense types
 * Returns expenses with payer names joined
 */
export async function getCarExpenses(
  supabase: SupabaseClient,
  userId: string
): Promise<ExpenseWithPayer[]> {
  // First get the user's car_id
  const { data: memberData, error: memberError } = await supabase
    .from("members")
    .select("car_id")
    .eq("user_id", userId)
    .eq("archived", false)
    .maybeSingle();

  if (memberError) {
    throw new Error(`Failed to fetch user membership: ${memberError.message}`);
  }

  if (!memberData?.car_id) {
    return [];
  }

  // Get all expenses for that car with payer names
  const { data, error } = await supabase
    .from("expenses")
    .select(`
      *,
      members!expenses_payer_id_fkey (
        user_id,
        users!members_user_id_fkey (
          name
        )
      )
    `)
    .eq("car_id", memberData.car_id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch expenses: ${error.message}`);
  }

  // Transform to include payer_name at top level
  return (data || []).map((e) => ({
    ...e,
    payer_name: (e.members as any)?.users?.name || null,
  })) as ExpenseWithPayer[];
}

/**
 * Get only fuel expenses
 */
export async function getCarFuelExpenses(
  supabase: SupabaseClient,
  userId: string
): Promise<ExpenseWithPayer[]> {
  const expenses = await getCarExpenses(supabase, userId);
  return expenses.filter((e) => e.type.toLowerCase() === "fuel");
}

/**
 * Get expense by ID
 */
export async function getExpenseById(
  supabase: SupabaseClient,
  expenseId: string
): Promise<Expense | null> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch expense: ${error.message}`);
  }

  return data;
}

/**
 * Create a new expense
 * Returns the created expense
 */
export async function createExpense(
  supabase: SupabaseClient,
  expense: ExpenseInsert
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert(expense)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create expense: ${error.message}`);
  }

  return data;
}

/**
 * Update an expense by ID
 * Returns the updated expense
 */
export async function updateExpense(
  supabase: SupabaseClient,
  expenseId: string,
  updates: ExpenseUpdate
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", expenseId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update expense: ${error.message}`);
  }

  return data;
}

/**
 * Delete an expense by ID
 */
export async function deleteExpense(
  supabase: SupabaseClient,
  expenseId: string
): Promise<void> {
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`);
  }
}
