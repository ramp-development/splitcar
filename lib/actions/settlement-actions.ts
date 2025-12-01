"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SettlementInsert, SettlementUpdate } from "@/lib/types";

// Input type using Pick to be explicit about what's required
type AddSettlementInput = Pick<
  SettlementInsert,
  "car_id" | "from_id" | "to_id" | "amount"
>;

/**
 * Add a new settlement
 */
export async function addSettlement(data: AddSettlementInput) {
  const supabase = await createClient();

  // Validate that from and to members are different
  if (data.from_id === data.to_id) {
    throw new Error("Cannot settle with yourself");
  }

  const { error } = await supabase.from("settlements").insert(data);

  if (error) {
    throw new Error(`Failed to add settlement: ${error.message}`);
  }

  revalidatePath("/settlements");
  revalidatePath("/balances");
}

/**
 * Mark a settlement as settled
 */
export async function markSettlementAsSettled(settlementId: string) {
  const supabase = await createClient();

  const updateData: SettlementUpdate = {
    status: "settled",
    settled_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("settlements")
    .update(updateData)
    .eq("id", settlementId);

  if (error) {
    throw new Error(`Failed to mark settlement as settled: ${error.message}`);
  }

  revalidatePath("/settlements");
  revalidatePath("/balances");
}

/**
 * Delete a settlement
 */
export async function deleteSettlement(settlementId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("settlements")
    .delete()
    .eq("id", settlementId);

  if (error) {
    throw new Error(`Failed to delete settlement: ${error.message}`);
  }

  revalidatePath("/settlements");
  revalidatePath("/balances");
}
