import { SupabaseClient } from "@supabase/supabase-js";
import { Car } from "@/lib/types";

/**
 * Check if user owns a car
 * Returns car ID if user owns a car, null otherwise
 * Throws error if database query fails
 */
export async function getOwnedCarId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("cars")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check car ownership: ${error.message}`);
  }

  return data?.id || null;
}

/**
 * Check if user is a member of a car
 * Returns car ID if user is a member, null otherwise
 * Throws error if database query fails
 */
export async function getMemberCarId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("members")
    .select("car_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check car membership: ${error.message}`);
  }

  return data?.car_id || null;
}

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
  const ownedCarId = await getOwnedCarId(supabase, userId);
  if (ownedCarId) return ownedCarId;

  // If not owner, check if they're a member of a car
  return getMemberCarId(supabase, userId);
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
