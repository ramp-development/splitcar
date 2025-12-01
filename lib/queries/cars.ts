import { SupabaseClient } from "@supabase/supabase-js";
import { Car } from "@/lib/types";

/**
 * Gets the car ID that a user has access to (either as owner or member)
 * Returns null if user has no car access
 * Throws error if database query fails
 */
export async function getUserCarId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  // First check if user owns a car
  const { data: ownedCar, error: ownedCarError } = await supabase
    .from("cars")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (ownedCarError) {
    throw new Error(`Failed to check car ownership: ${ownedCarError.message}`);
  }

  if (ownedCar) {
    return ownedCar.id;
  }

  // If not owner, check if they're a member of a car
  const { data: membership, error: membershipError } = await supabase
    .from("members")
    .select("car_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Failed to check car membership: ${membershipError.message}`);
  }

  return membership?.car_id || null;
}

/**
 * Gets the full car details that a user has access to (either as owner or member)
 * Uses a database function to bypass RLS issues
 * Returns null if user has no car access
 * Throws error if database query fails
 */
export async function getUserCar(
  supabase: SupabaseClient,
  userId: string
): Promise<Car | null> {
  const { data, error } = await supabase.rpc("get_user_car", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch user car: ${error.message}`);
  }

  // The function returns an array, get the first item
  return (data?.[0] as Car) || null;
}
