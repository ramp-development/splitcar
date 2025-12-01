"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FuelFillInsert, FuelFillUpdate } from "@/lib/types";

/**
 * Add a new fuel fill
 */
export async function addFuelFill(data: {
  carId: string;
  payerMemberId: string;
  amount: number;
  date: Date;
}) {
  const supabase = await createClient();

  const fuelFillData: FuelFillInsert = {
    car_id: data.carId,
    payer_member_id: data.payerMemberId,
    amount: data.amount,
    date: data.date.toISOString().split("T")[0],
  };

  const { error } = await supabase.from("fuel_fills").insert(fuelFillData);

  if (error) {
    throw new Error(`Failed to add fuel fill: ${error.message}`);
  }

  revalidatePath("/fuel");
  revalidatePath("/balances");
}

/**
 * Update an existing fuel fill
 */
export async function updateFuelFill(
  fuelFillId: string,
  data: {
    payerMemberId?: string;
    amount?: number;
    date?: Date;
  }
) {
  const supabase = await createClient();

  const updateData: FuelFillUpdate = {};
  if (data.payerMemberId !== undefined) updateData.payer_member_id = data.payerMemberId;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.date !== undefined) updateData.date = data.date.toISOString().split("T")[0];

  const { error } = await supabase
    .from("fuel_fills")
    .update(updateData)
    .eq("id", fuelFillId);

  if (error) {
    throw new Error(`Failed to update fuel fill: ${error.message}`);
  }

  revalidatePath("/fuel");
  revalidatePath("/balances");
}

/**
 * Delete a fuel fill
 */
export async function deleteFuelFill(fuelFillId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("fuel_fills")
    .delete()
    .eq("id", fuelFillId);

  if (error) {
    throw new Error(`Failed to delete fuel fill: ${error.message}`);
  }

  revalidatePath("/fuel");
  revalidatePath("/balances");
}
