"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MemberInsert, MemberUpdate } from "@/lib/types";

// Input types using Pick to be explicit about what's required
type AddMemberInput = Pick<MemberInsert, "car_id" | "name" | "phone" | "is_guest">;

type UpdateMemberInput = Partial<Pick<MemberUpdate, "name" | "phone" | "is_guest">>;

/**
 * Add a new member to a car
 */
export async function addMember(data: AddMemberInput) {
  const supabase = await createClient();

  const { error } = await supabase.from("members").insert(data);

  if (error) {
    throw new Error(`Failed to add member: ${error.message}`);
  }

  revalidatePath("/members");
}

/**
 * Update an existing member
 */
export async function updateMember(memberId: string, data: UpdateMemberInput) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("members")
    .update(data)
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
