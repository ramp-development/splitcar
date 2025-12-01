import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/types/database.types";

type TripFromFunction =
  Database["public"]["Functions"]["get_car_trips"]["Returns"][number];

/**
 * Get all trips for a car (bypasses RLS using database function)
 */
export async function getCarTrips(
  supabase: SupabaseClient,
  userId: string
): Promise<TripFromFunction[]> {
  const { data, error } = await supabase.rpc("get_car_trips", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch trips: ${error.message}`);
  }

  return (data || []) as TripFromFunction[];
}
