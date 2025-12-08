import { SupabaseClient } from "@supabase/supabase-js";
import { Car, CarInsert, CarUpdate } from "@/lib/types";

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
 * Returns null if user has no car access
 * Throws error if database query fails
 */
export async function getUserCar(
  supabase: SupabaseClient,
  userId: string
): Promise<Car | null> {
  // First get the user's car_id
  const carId = await getUserCarId(supabase, userId);

  if (!carId) {
    return null;
  }

  // Then get the full car details
  return getCarById(supabase, carId);
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

/**
 * Creates a new car
 * Returns the created car
 * Throws error if database query fails
 */
export async function createCar(
  supabase: SupabaseClient,
  car: CarInsert
): Promise<Car> {
  const { data, error } = await supabase
    .from("cars")
    .insert(car)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create car: ${error.message}`);
  }

  return data;
}

/**
 * Updates a car by ID
 * Returns the updated car
 * Throws error if database query fails
 */
export async function updateCar(
  supabase: SupabaseClient,
  carId: string,
  updates: CarUpdate
): Promise<Car> {
  const { data, error } = await supabase
    .from("cars")
    .update(updates)
    .eq("id", carId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update car: ${error.message}`);
  }

  return data;
}

/**
 * Deletes a car by ID
 * Cascades to all related data (members, expenses, trips, settlements)
 * Throws error if database query fails
 */
export async function deleteCar(
  supabase: SupabaseClient,
  carId: string
): Promise<void> {
  const { error } = await supabase.from("cars").delete().eq("id", carId);

  if (error) {
    throw new Error(`Failed to delete car: ${error.message}`);
  }
}
