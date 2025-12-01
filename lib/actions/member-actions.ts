"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MemberInsert, MemberUpdate } from "@/lib/types";

/**
 * Add a new member to a car
 */
export async function addMember(data: {
  carId: string;
  name: string;
  phone?: string;
  isGuest: boolean;
}) {
  const supabase = await createClient();

  const memberData: MemberInsert = {
    car_id: data.carId,
    name: data.name,
    phone: data.phone || null,
    is_guest: data.isGuest,
  };

  const { error } = await supabase.from("members").insert(memberData);

  if (error) {
    throw new Error(`Failed to add member: ${error.message}`);
  }

  revalidatePath("/members");
}

/**
 * Update an existing member
 */
export async function updateMember(memberId: string, data: {
  name?: string;
  phone?: string;
  isGuest?: boolean;
}) {
  const supabase = await createClient();

  const updateData: MemberUpdate = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.isGuest !== undefined) updateData.is_guest = data.isGuest;

  const { error } = await supabase
    .from("members")
    .update(updateData)
    .eq("id", memberId);

  if (error) {
    throw new Error(`Failed to update member: ${error.message}`);
  }

  revalidatePath("/members");
}

/**
 * Archive or unarchive a member
 */
export async function archiveMember(memberId: string, archived: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("members")
    .update({ archived })
    .eq("id", memberId);

  if (error) {
    throw new Error(`Failed to ${archived ? "archive" : "unarchive"} member: ${error.message}`);
  }

  revalidatePath("/members");
}

/**
 * Toggle guest status for a member
 */
export async function toggleMemberGuest(memberId: string, isGuest: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("members")
    .update({ is_guest: isGuest })
    .eq("id", memberId);

  if (error) {
    throw new Error(`Failed to update member: ${error.message}`);
  }

  revalidatePath("/members");
}
