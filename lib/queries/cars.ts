import { SupabaseClient } from "@supabase/supabase-js";
import { Car, CarFromFunction } from "@/lib/types";

/**
 * Gets the car ID that a user has access to (as admin or member)
 * Returns null if user has no car access
 * Throws error if database query fails
 */
export async function getUserCarId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("members")
    .select("car_id")
    .eq("user_id", userId)
    .eq("archived", false)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check car access: ${error.message}`);
  }

  return data?.car_id || null;
}

/**
 * Gets the full car details that a user has access to
 * Uses a database function to bypass RLS
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
  return (data?.[0] as CarFromFunction) || null;
}

/**
 * Gets a car by ID
 * Throws error if database query fails
 */
export async function getCarById(
  supabase: SupabaseClient,
  carId: string
): Promise<Car | null> {
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("id", carId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch car: ${error.message}`);
  }

  return data;
}
