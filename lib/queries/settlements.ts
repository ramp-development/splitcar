import { SupabaseClient } from "@supabase/supabase-js";
import { Settlement, SettlementInsert, SettlementUpdate } from "@/lib/types";

/**
 * Settlement with from/to member names joined
 */
export type SettlementWithNames = Settlement & {
  from_name: string | null;
  to_name: string | null;
};

/**
 * Get all settlements for a car that the user has access to
 * Returns settlements with from/to member names joined
 */
export async function getCarSettlements(
  supabase: SupabaseClient,
  userId: string
): Promise<SettlementWithNames[]> {
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

  // Get all settlements for that car with member names
  const { data, error } = await supabase
    .from("settlements")
    .select(
      `
      *,
      from_member:members!settlements_from_id_fkey (
        user_id,
        users!members_user_id_fkey (
          name
        )
      ),
      to_member:members!settlements_to_id_fkey (
        user_id,
        users!members_user_id_fkey (
          name
        )
      )
    `
    )
    .eq("car_id", memberData.car_id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch settlements: ${error.message}`);
  }

  // Transform to include from_name and to_name at top level
  return (data || []).map((s) => ({
    ...s,
    from_name: s.from_member?.users?.name || null,
    to_name: s.to_member?.users?.name || null,
  })) as SettlementWithNames[];
}

/**
 * Get settlement by ID
 */
export async function getSettlementById(
  supabase: SupabaseClient,
  settlementId: string
): Promise<Settlement | null> {
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("id", settlementId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch settlement: ${error.message}`);
  }

  return data;
}

/**
 * Create a new settlement
 * Returns the created settlement
 */
export async function createSettlement(
  supabase: SupabaseClient,
  settlement: SettlementInsert
): Promise<Settlement> {
  const { data, error } = await supabase
    .from("settlements")
    .insert(settlement)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create settlement: ${error.message}`);
  }

  return data;
}

/**
 * Update a settlement by ID
 * Returns the updated settlement
 */
export async function updateSettlement(
  supabase: SupabaseClient,
  settlementId: string,
  updates: SettlementUpdate
): Promise<Settlement> {
  const { data, error } = await supabase
    .from("settlements")
    .update(updates)
    .eq("id", settlementId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update settlement: ${error.message}`);
  }

  return data;
}

/**
 * Mark a settlement as settled
 * Sets status to 'settled' and settled_at to now
 */
export async function markSettlementAsSettled(
  supabase: SupabaseClient,
  settlementId: string
): Promise<Settlement> {
  const { data, error } = await supabase
    .from("settlements")
    .update({
      status: "settled",
      settled_at: new Date().toISOString(),
    })
    .eq("id", settlementId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to mark settlement as settled: ${error.message}`);
  }

  return data;
}

/**
 * Delete a settlement by ID
 */
export async function deleteSettlement(
  supabase: SupabaseClient,
  settlementId: string
): Promise<void> {
  const { error } = await supabase
    .from("settlements")
    .delete()
    .eq("id", settlementId);

  if (error) {
    throw new Error(`Failed to delete settlement: ${error.message}`);
  }
}
