"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { MemberInsert, MemberUpdate, MemberRole } from "@/lib/types";

// Input types using Pick to be explicit about what's required
type AddMemberInput = Pick<MemberInsert, "car_id" | "role"> & {
  invite_code?: string; // Optional, will be auto-generated if not provided
};

type UpdateMemberInput = Partial<Pick<MemberUpdate, "role" | "archived">>;

/**
 * Add a new member to a car (creates an invite)
 */
export async function addMember(data: AddMemberInput) {
  const supabase = await createClient();

  const memberData: MemberInsert = {
    car_id: data.car_id,
    role: data.role,
    invite_code: data.invite_code || "", // Empty string triggers auto-generation
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
    throw new Error(
      `Failed to ${archived ? "archive" : "unarchive"} member: ${error.message}`
    );
  }

  revalidatePath("/members");
  revalidatePath("/balances");
}

/**
 * Change member role (owner <-> guest)
 */
export async function changeMemberRole(memberId: string, role: MemberRole) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("members")
    .update({ role })
    .eq("id", memberId);

  if (error) {
    throw new Error(`Failed to update member role: ${error.message}`);
  }

  revalidatePath("/members");
}

/**
 * Accept an invite and link member to user
 */
export async function acceptInvite(inviteCode: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("accept_invite", {
    p_invite_code: inviteCode,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to accept invite: ${error.message}`);
  }

  if (!data) {
    throw new Error("Invalid invite code or invite already accepted");
  }

  revalidatePath("/");
  return data; // Returns member_id
}
