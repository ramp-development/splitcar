"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SettlementInsert } from "@/lib/types";

// Input type using Pick to be explicit about what's required
type AddSettlementInput = Pick<
  SettlementInsert,
  "car_id" | "from_member_id" | "to_member_id" | "amount"
>;

/**
 * Add a new settlement
 */
export async function addSettlement(data: AddSettlementInput) {
  const supabase = await createClient();

  // Validate that from and to members are different
  if (data.from_member_id === data.to_member_id) {
    throw new Error("Cannot settle with yourself");
  }

  const { error } = await supabase.from("settlements").insert(data);

  if (error) {
    throw new Error(`Failed to add settlement: ${error.message}`);
  }

  revalidatePath("/settlements");
  revalidatePath("/balances");
}
