"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SettlementInsert } from "@/lib/types";

/**
 * Add a new settlement
 */
export async function addSettlement(data: {
  carId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}) {
  const supabase = await createClient();

  // Validate that from and to members are different
  if (data.fromMemberId === data.toMemberId) {
    throw new Error("Cannot settle with yourself");
  }

  const settlementData: SettlementInsert = {
    car_id: data.carId,
    from_member_id: data.fromMemberId,
    to_member_id: data.toMemberId,
    amount: data.amount,
  };

  const { error } = await supabase.from("settlements").insert(settlementData);

  if (error) {
    throw new Error(`Failed to add settlement: ${error.message}`);
  }

  revalidatePath("/settlements");
  revalidatePath("/balances");
}
