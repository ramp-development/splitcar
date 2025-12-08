import { SupabaseClient } from "@supabase/supabase-js";
import { Trip, TripInsert, TripUpdate } from "@/lib/types";

/**
 * Get all trips for a car that the user has access to
 */
export async function getCarTrips(
  supabase: SupabaseClient,
  userId: string
): Promise<Trip[]> {
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

  // Get all trips for that car
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("car_id", memberData.car_id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch trips: ${error.message}`);
  }

  return data || [];
}

/**
 * Get trip by ID
 */
export async function getTripById(
  supabase: SupabaseClient,
  tripId: string
): Promise<Trip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch trip: ${error.message}`);
  }

  return data;
}

/**
 * Create a new trip
 * Returns the created trip
 */
export async function createTrip(
  supabase: SupabaseClient,
  trip: TripInsert
): Promise<Trip> {
  const { data, error } = await supabase
    .from("trips")
    .insert(trip)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create trip: ${error.message}`);
  }

  return data;
}

/**
 * Update a trip by ID
 * Returns the updated trip
 */
export async function updateTrip(
  supabase: SupabaseClient,
  tripId: string,
  updates: TripUpdate
): Promise<Trip> {
  const { data, error } = await supabase
    .from("trips")
    .update(updates)
    .eq("id", tripId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update trip: ${error.message}`);
  }

  return data;
}

/**
 * Delete a trip by ID
 */
export async function deleteTrip(
  supabase: SupabaseClient,
  tripId: string
): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) {
    throw new Error(`Failed to delete trip: ${error.message}`);
  }
}
