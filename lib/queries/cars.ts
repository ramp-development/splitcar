import { SupabaseClient } from "@supabase/supabase-js";
import { Car } from "@/lib/types";

/**
 * Gets the car ID that a user has access to (either as owner or member)
 * Returns null if user has no car access
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

  if (ownedCar) {
    return ownedCar.id;
  }

  // If not owner, check if they're a member of a car
  const { data: membership, error: membershipError } = await supabase
    .from("members")
    .select("car_id, user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return membership?.car_id || null;
}

/**
 * Gets the full car details that a user has access to (either as owner or member)
 * Uses a database function to bypass RLS issues
 * Returns null if user has no car access
 */
export async function getUserCar(
  supabase: SupabaseClient,
  userId: string
): Promise<Car | null> {
  const { data, error } = await supabase.rpc("get_user_car", {
    p_user_id: userId,
  });

  if (error) {
    console.error("[getUserCar] Error:", error);
    return null;
  }

  // The function returns an array, get the first item
  return (data?.[0] as Car) || null;
}
