import { SupabaseClient } from "@supabase/supabase-js";
import { SettlementFromFunction } from "@/lib/types";

/**
 * Get all settlements for a car (bypasses RLS using database function)
 */
export async function getCarSettlements(
  supabase: SupabaseClient,
  userId: string
): Promise<SettlementFromFunction[]> {
  const { data, error } = await supabase.rpc("get_car_settlements", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch settlements: ${error.message}`);
  }

  return (data || []) as SettlementFromFunction[];
}
