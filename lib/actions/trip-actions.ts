"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TripInsert, TripUpdate } from "@/lib/types";

/**
 * Add a new trip
 */
export async function addTrip(data: {
  carId: string;
  name?: string;
  distanceKm: number;
  passengerMemberIds: string[];
  date: Date;
}) {
  const supabase = await createClient();

  const tripData: TripInsert = {
    car_id: data.carId,
    name: data.name || null,
    distance_km: data.distanceKm,
    passenger_member_ids: data.passengerMemberIds,
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
export async function updateTrip(
  tripId: string,
  data: {
    name?: string;
    distanceKm?: number;
    passengerMemberIds?: string[];
    date?: Date;
  }
) {
  const supabase = await createClient();

  const updateData: TripUpdate = {};
  if (data.name !== undefined) updateData.name = data.name || null;
  if (data.distanceKm !== undefined) updateData.distance_km = data.distanceKm;
  if (data.passengerMemberIds !== undefined) updateData.passenger_member_ids = data.passengerMemberIds;
  if (data.date !== undefined) updateData.date = data.date.toISOString().split("T")[0];

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

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId);

  if (error) {
    throw new Error(`Failed to delete trip: ${error.message}`);
  }

  revalidatePath("/trips");
  revalidatePath("/balances");
}
