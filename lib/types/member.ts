import { Database } from "./database.types";

// Base types from database
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type MemberInsert = Database["public"]["Tables"]["members"]["Insert"];
export type MemberUpdate = Database["public"]["Tables"]["members"]["Update"];

// Member status based on user_id
export type MemberStatus = "joined" | "pending" | "no_phone";

// Helper functions
export function getMemberStatus(member: Member): MemberStatus {
  if (member.user_id) return "joined";
  if (member.phone) return "pending";
  return "no_phone";
}

export function isMemberOwner(member: Member, carOwnerId: string): boolean {
  return member.user_id === carOwnerId;
}

export function canMemberBeInvited(member: Member): boolean {
  return !member.user_id && !member.archived;
}

// Sort members: current user first, then members, then guests, then alphabetically
export function sortMembersByPriority(
  members: Member[],
  currentUserId: string | null
): Member[] {
  return [...members].sort((a, b) => {
    // Current user first
    if (a.user_id === currentUserId && b.user_id !== currentUserId) return -1;
    if (b.user_id === currentUserId && a.user_id !== currentUserId) return 1;

    // Then by guest status (members before guests)
    if (a.is_guest !== b.is_guest) {
      return a.is_guest ? 1 : -1;
    }

    // Then alphabetically by name
    return a.name.localeCompare(b.name);
  });
}

// Filter out archived members
export function getActiveMembers(members: Member[]): Member[] {
  return members.filter((m) => !m.archived);
}
