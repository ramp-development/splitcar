import {
  Member,
  MemberBalance,
  Car,
  Expense,
  Trip,
  Settlement,
} from "@/lib/types";
import { calculateCostPerKm } from "@/lib/types/car";
import { getSplitMemberIds } from "@/lib/types/expense";

// Define minimal types needed for balance calculation
type ExpenseForBalance = Pick<
  Expense,
  "payer_id" | "amount" | "type" | "split_with"
>;
type TripForBalance = Pick<Trip, "distance" | "passengers">;
type SettlementForBalance = Pick<Settlement, "from_id" | "to_id" | "amount">;

/**
 * Calculate balances for all members
 *
 * Balance calculation logic:
 * - Fuel expenses: Payer contributes, splits evenly among ALL active members
 * - Other expenses: Payer contributes, splits among specified members in split_with
 * - Trips: Usage cost split among passengers based on distance
 * - Settlements: Direct payments between members
 */
export function calculateMemberBalances(
  members: Member[],
  expenses: ExpenseForBalance[],
  trips: TripForBalance[],
  settlements: SettlementForBalance[],
  car: Car
): MemberBalance[] {
  const costPerKm = calculateCostPerKm(car);
  const activeMemberIds = members.filter((m) => !m.archived).map((m) => m.id);

  return members.map((member) => {
    // Calculate expenses paid (fuel + other)
    const expensesPaid = expenses
      .filter((expense) => expense.payer_id === member.id)
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate expense share owed
    const expensesOwed = expenses.reduce((sum, expense) => {
      const splitMembers = getSplitMemberIds(expense, activeMemberIds);

      if (splitMembers.includes(member.id)) {
        // This member is part of the split
        return sum + expense.amount / splitMembers.length;
      }
      return sum;
    }, 0);

    // Calculate trip usage
    const tripUsage = trips
      .filter((trip) => trip.passengers.includes(member.id))
      .reduce((sum, trip) => {
        const tripCost = trip.distance * costPerKm;
        const costPerPassenger =
          trip.passengers.length > 0 ? tripCost / trip.passengers.length : 0;
        return sum + costPerPassenger;
      }, 0);

    // Calculate settlements received
    const settlementsReceived = settlements
      .filter((settlement) => settlement.to_id === member.id)
      .reduce((sum, settlement) => sum + settlement.amount, 0);

    // Calculate settlements sent
    const settlementsSent = settlements
      .filter((settlement) => settlement.from_id === member.id)
      .reduce((sum, settlement) => sum + settlement.amount, 0);

    // Calculate net balance
    // Positive balance = member is owed money
    // Negative balance = member owes money
    const netBalance =
      expensesPaid -
      expensesOwed -
      tripUsage +
      settlementsReceived -
      settlementsSent;

    return {
      member,
      fuelPaid: expensesPaid, // Keep for backward compatibility (rename later)
      tripUsage,
      settlementsReceived,
      settlementsSent,
      netBalance,
    };
  });
}
