import { SupabaseClient } from "@supabase/supabase-js";
import { Member } from "@/lib/types";

/**
 * Get all members for a car (bypasses RLS using database function)
 */
export async function getCarMembers(
  supabase: SupabaseClient,
  userId: string
): Promise<Member[]> {
  const { data, error } = await supabase.rpc("get_car_members", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Failed to fetch members: ${error.message}`);
  }

  return (data || []) as Member[];
}

/**
 * Get active (non-archived) members only
 */
export async function getActiveMembers(
  supabase: SupabaseClient,
  userId: string
): Promise<Member[]> {
  const members = await getCarMembers(supabase, userId);
  return members.filter((m) => !m.archived);
}
