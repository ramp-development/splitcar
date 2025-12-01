import { SupabaseClient } from "@supabase/supabase-js";
import { FuelFillFromFunction } from "@/lib/types";

/**
 * Get all fuel fills for a car (bypasses RLS using database function)
 */
export async function getCarFuelFills(
  supabase: SupabaseClient,
  userId: string
): Promise<FuelFillFromFunction[]> {
  const { data, error } = await supabase.rpc("get_car_fuel_fills", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch fuel fills: ${error.message}`);
  }

  return (data || []) as FuelFillFromFunction[];
}
