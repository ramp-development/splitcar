import { MemberWithUser } from "@/lib/queries/members";

export type MemberGroups = {
  currentUser: MemberWithUser | null;
  ownerMembers: MemberWithUser[];
  guestMembers: MemberWithUser[];
  activeMembers: MemberWithUser[];
};

/**
 * Sort members by priority: admin first, current user, owners, guests, then by join date
 */
export function sortMembersByPriority(
  members: MemberWithUser[],
  currentUserId: string | null
): MemberWithUser[] {
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

/**
 * Group members into categories for select dropdowns
 */
export function groupMembersForSelect(
  members: MemberWithUser[],
  currentUserId: string | null
): MemberGroups {
  const activeMembers = members.filter((m) => !m.archived);

  const currentUser = activeMembers.find((m) => m.user_id === currentUserId) || null;
  const ownerMembers = activeMembers
    .filter((m) => m.user_id !== currentUserId && m.role === "owner")
    .sort((a, b) => {
      if (a.joined_at && b.joined_at) {
        return (
          new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
        );
      }
      return 0;
    });
  const guestMembers = activeMembers
    .filter((m) => m.role === "guest")
    .sort((a, b) => {
      if (a.joined_at && b.joined_at) {
        return (
          new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
        );
      }
      return 0;
    });

  return {
    currentUser,
    ownerMembers,
    guestMembers,
    activeMembers,
  };
}
