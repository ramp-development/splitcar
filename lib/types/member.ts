import { Database } from "./database.types";

// Base types from database
export type Member = Database["public"]["Tables"]["members"]["Row"];
export type MemberInsert = Database["public"]["Tables"]["members"]["Insert"];
export type MemberUpdate = Database["public"]["Tables"]["members"]["Update"];
export type MemberRole = Database["public"]["Enums"]["member_role"];

// Member status based on user_id and joined_at
export type MemberStatus = "joined" | "pending";

// Helper functions
export function getMemberStatus(member: Member): MemberStatus {
  return member.user_id && member.joined_at ? "joined" : "pending";
}

export function isMemberAdmin(member: Member): boolean {
  return member.is_admin === true;
}

export function canMemberBeInvited(member: Member): boolean {
  return !member.user_id && !member.archived;
}

// Sort members: admin first, then owners, then guests, then by joined date
export function sortMembersByPriority(
  members: Member[],
  currentUserId: string | null
): Member[] {
  return [...members].sort((a, b) => {
    // Current user first
    if (a.user_id === currentUserId && b.user_id !== currentUserId) return -1;
    if (b.user_id === currentUserId && a.user_id !== currentUserId) return 1;

    // Admin first
    if (a.is_admin !== b.is_admin) {
      return a.is_admin ? -1 : 1;
    }

    // Then by role (owner before guest)
    if (a.role !== b.role) {
      return a.role === "owner" ? -1 : 1;
    }

    // Then by joined date (earliest first)
    if (a.joined_at && b.joined_at) {
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
    }

    return 0;
  });
}

// Filter out archived members
export function getActiveMembers(members: Member[]): Member[] {
  return members.filter((m) => !m.archived);
}

// Get first name from full name (for greetings)
export function getFirstName(fullName: string | null): string {
  if (!fullName) return "User";
  return fullName.split(" ")[0];
}

// Get initials for avatar (from Clerk name or member data)
export function getInitials(fullName: string | null): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
