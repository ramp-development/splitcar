"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ExpenseInsert, ExpenseUpdate } from "@/lib/types";

// Input types using Pick to be explicit about what's required
type AddExpenseInput = Pick<
  ExpenseInsert,
  "car_id" | "payer_id" | "type" | "amount"
> & {
  description?: string;
  split_with?: string[]; // For non-fuel expenses
  date: Date; // Accept Date object, we'll convert to string
};

type UpdateExpenseInput = Partial<
  Pick<ExpenseUpdate, "payer_id" | "type" | "amount" | "description" | "split_with">
> & {
  date?: Date; // Accept Date object, we'll convert to string
};

/**
 * Add a new expense (fuel, insurance, service, etc.)
 */
export async function addExpense(data: AddExpenseInput) {
  const supabase = await createClient();

  const expenseData: ExpenseInsert = {
    car_id: data.car_id,
    payer_id: data.payer_id,
    type: data.type,
    amount: data.amount,
    description: data.description,
    split_with: data.split_with,
    date: data.date.toISOString().split("T")[0],
  };

  const { error } = await supabase.from("expenses").insert(expenseData);

  if (error) {
    throw new Error(`Failed to add expense: ${error.message}`);
  }

  revalidatePath("/fuel");
  revalidatePath("/expenses");
  revalidatePath("/balances");
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  expenseId: string,
  data: UpdateExpenseInput
) {
  const supabase = await createClient();

  const updateData: ExpenseUpdate = {};
  if (data.payer_id !== undefined) updateData.payer_id = data.payer_id;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.split_with !== undefined) updateData.split_with = data.split_with;
  if (data.date !== undefined)
    updateData.date = data.date.toISOString().split("T")[0];

  const { error } = await supabase
    .from("expenses")
    .update(updateData)
    .eq("id", expenseId);

  if (error) {
    throw new Error(`Failed to update expense: ${error.message}`);
  }

  revalidatePath("/fuel");
  revalidatePath("/expenses");
  revalidatePath("/balances");
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) {
    throw new Error(`Failed to delete expense: ${error.message}`);
  }

  revalidatePath("/fuel");
  revalidatePath("/expenses");
  revalidatePath("/balances");
}
