import { Member } from "@/lib/types";

/**
 * Sort members by priority: current user first, then members, then guests, then alphabetically
 */
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

/**
 * Group members into categories for select dropdowns
 */
export function groupMembersForSelect(
  members: Member[],
  currentUserId: string | null
) {
  const activeMembers = members.filter((m) => !m.archived);

  const currentUser = activeMembers.find((m) => m.user_id === currentUserId);
  const otherMembers = activeMembers
    .filter((m) => m.user_id !== currentUserId && !m.is_guest)
    .sort((a, b) => a.name.localeCompare(b.name));
  const guestMembers = activeMembers
    .filter((m) => m.is_guest)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    currentUser,
    otherMembers,
    guestMembers,
    activeMembers,
  };
}
