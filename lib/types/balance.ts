import { Member } from "./member";

// Generic balance calculation type that works with any member type
export type MemberBalance<T extends { id: string; archived?: boolean | null } = Member> = {
  member: T;
  fuelPaid: number;
  tripUsage: number;
  settlementsReceived: number;
  settlementsSent: number;
  netBalance: number;
};

// Helper to determine if balance is positive (owed) or negative (owes)
export function isOwed<T extends { id: string; archived?: boolean | null }>(
  balance: MemberBalance<T>
): boolean {
  return balance.netBalance > 0;
}

export function owesAmount<T extends { id: string; archived?: boolean | null }>(
  balance: MemberBalance<T>
): boolean {
  return balance.netBalance < 0;
}

export function isSettled<T extends { id: string; archived?: boolean | null }>(
  balance: MemberBalance<T>
): boolean {
  return Math.abs(balance.netBalance) < 0.01; // Within 1 cent
}

// Format balance for display
export function getBalanceStatus<T extends { id: string; archived?: boolean | null }>(
  balance: MemberBalance<T>
): "owed" | "owes" | "settled" {
  if (isSettled(balance)) return "settled";
  return isOwed(balance) ? "owed" : "owes";
}
