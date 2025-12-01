import { SupabaseClient } from "@supabase/supabase-js";
import { MemberFromFunction } from "@/lib/types";

/**
 * Get all members for a car (bypasses RLS using database function)
 * Returns members with user names joined
 */
export async function getCarMembers(
  supabase: SupabaseClient,
  userId: string
): Promise<MemberFromFunction[]> {
  const { data, error } = await supabase.rpc("get_car_members", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  return (data || []) as MemberFromFunction[];
}

/**
 * Get active (non-archived) members only
 */
export async function getActiveMembers(
  supabase: SupabaseClient,
  userId: string
): Promise<MemberFromFunction[]> {
  const members = await getCarMembers(supabase, userId);
  return members.filter((m) => !m.archived);
}

/**
 * Get member by invite code
 */
export async function getMemberByInviteCode(
  supabase: SupabaseClient,
  inviteCode: string
): Promise<MemberFromFunction | null> {
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
