import { Member } from "./member";

// Balance calculation types
export type MemberBalance = {
  member: Member;
  fuelPaid: number;
  tripUsage: number;
  settlementsReceived: number;
  settlementsSent: number;
  netBalance: number;
};

// Helper to determine if balance is positive (owed) or negative (owes)
export function isOwed(balance: MemberBalance): boolean {
  return balance.netBalance > 0;
}

export function owesAmount(balance: MemberBalance): boolean {
  return balance.netBalance < 0;
}

export function isSettled(balance: MemberBalance): boolean {
  return Math.abs(balance.netBalance) < 0.01; // Within 1 cent
}

// Format balance for display
export function getBalanceStatus(
  balance: MemberBalance
): "owed" | "owes" | "settled" {
  if (isSettled(balance)) return "settled";
  return isOwed(balance) ? "owed" : "owes";
}
