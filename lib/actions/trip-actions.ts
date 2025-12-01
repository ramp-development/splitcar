"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TripInsert, TripUpdate } from "@/lib/types";

// Input types using Pick to be explicit about what's required
type AddTripInput = Pick<
  TripInsert,
  "car_id" | "name" | "distance" | "passengers"
> & {
  date: Date; // Accept Date object, we'll convert to string
};

type UpdateTripInput = Partial<
  Pick<TripUpdate, "name" | "distance" | "passengers">
> & {
  date?: Date; // Accept Date object, we'll convert to string
};

/**
 * Add a new trip
 */
export async function addTrip(data: AddTripInput) {
  const supabase = await createClient();

  const tripData: TripInsert = {
    car_id: data.car_id,
    name: data.name,
    distance: data.distance,
    passengers: data.passengers,
    date: data.date.toISOString().split("T")[0],
  };

  const { error } = await supabase.from("trips").insert(tripData);

  if (error) {
    throw new Error(`Failed to add trip: ${error.message}`);
  }

  revalidatePath("/trips");
  revalidatePath("/balances");
}

/**
 * Update an existing trip
 */
export async function updateTrip(tripId: string, data: UpdateTripInput) {
  const supabase = await createClient();

  const updateData: TripUpdate = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.distance !== undefined) updateData.distance = data.distance;
  if (data.passengers !== undefined) updateData.passengers = data.passengers;
  if (data.date !== undefined)
    updateData.date = data.date.toISOString().split("T")[0];

  const { error } = await supabase
    .from("trips")
    .update(updateData)
    .eq("id", tripId);

  if (error) {
    throw new Error(`Failed to update trip: ${error.message}`);
  }

  revalidatePath("/trips");
  revalidatePath("/balances");
}

/**
 * Delete a trip
 */
export async function deleteTrip(tripId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) {
    throw new Error(`Failed to delete trip: ${error.message}`);
  }

  revalidatePath("/trips");
  revalidatePath("/balances");
}
