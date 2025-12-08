import { SupabaseClient } from "@supabase/supabase-js";
import { Member, MemberInsert, MemberUpdate } from "@/lib/types";

/**
 * Member with user name joined
 */
export type MemberWithUser = Member & {
  name: string | null;
};

/**
 * Get all members for a car that the user has access to
 * Returns members with user names joined
 */
export async function getCarMembers(
  supabase: SupabaseClient,
  userId: string
): Promise<MemberWithUser[]> {
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

  // Get all members for that car with user names
  const { data, error } = await supabase
    .from("members")
    .select(`
      *,
      users!members_user_id_fkey (
        name
      )
    `)
    .eq("car_id", memberData.car_id)
    .order("is_admin", { ascending: false })
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  // Transform to include name at top level
  return (data || []).map((m) => ({
    ...m,
    name: (m.users as any)?.name || null,
  })) as MemberWithUser[];
}

/**
 * Get active (non-archived) members only
 */
export async function getActiveMembers(
  supabase: SupabaseClient,
  userId: string
): Promise<MemberWithUser[]> {
  const members = await getCarMembers(supabase, userId);
  return members.filter((m) => !m.archived);
}

/**
 * Get member by ID
 */
export async function getMemberById(
  supabase: SupabaseClient,
  memberId: string
): Promise<Member | null> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch member: ${error.message}`);
  }

  return data;
}

/**
 * Get member by invite code
 */
export async function getMemberByInviteCode(
  supabase: SupabaseClient,
  inviteCode: string
): Promise<Member | null> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch member: ${error.message}`);
  }

  return data;
}

/**
 * Create a new member
 * Returns the created member
 */
export async function createMember(
  supabase: SupabaseClient,
  member: MemberInsert
): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .insert(member)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create member: ${error.message}`);
  }

  return data;
}

/**
 * Update a member by ID
 * Returns the updated member
 */
export async function updateMember(
  supabase: SupabaseClient,
  memberId: string,
  updates: MemberUpdate
): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .update(updates)
    .eq("id", memberId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update member: ${error.message}`);
  }

  return data;
}

/**
 * Archive a member by ID (soft delete)
 * Returns the archived member
 */
export async function archiveMember(
  supabase: SupabaseClient,
  memberId: string
): Promise<Member> {
  const { data, error } = await supabase
    .from("members")
    .update({ archived: true })
    .eq("id", memberId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to archive member: ${error.message}`);
  }

  return data;
}

/**
 * Delete a member by ID (hard delete)
 * Note: This will cascade delete all related expenses, trips, and settlements
 */
export async function deleteMember(
  supabase: SupabaseClient,
  memberId: string
): Promise<void> {
  const { error } = await supabase.from("members").delete().eq("id", memberId);

  if (error) {
    throw new Error(`Failed to delete member: ${error.message}`);
  }
}

/**
 * Accept an invite using the database function
 * Links member to user and sets joined_at
 * Returns the member ID
 */
export async function acceptInvite(
  supabase: SupabaseClient,
  inviteCode: string,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("accept_invite", {
    p_invite_code: inviteCode,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to accept invite: ${error.message}`);
  }

  return data;
}
