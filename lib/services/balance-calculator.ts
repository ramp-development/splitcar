import { Member, MemberBalance, Car, FuelFill, Trip, Settlement } from "@/lib/types";
import { calculateCostPerKm } from "@/lib/types/car";

// Define minimal types needed for balance calculation
type FuelFillForBalance = Pick<FuelFill, "payer_member_id" | "amount">;
type TripForBalance = Pick<Trip, "distance_km" | "passenger_member_ids">;
type SettlementForBalance = Pick<Settlement, "from_member_id" | "to_member_id" | "amount">;

/**
 * Calculate balances for all members
 */
export function calculateMemberBalances(
  members: Member[],
  fuelFills: FuelFillForBalance[],
  trips: TripForBalance[],
  settlements: SettlementForBalance[],
  car: Car
): MemberBalance[] {
  const costPerKm = calculateCostPerKm(car);

  return members.map((member) => {
    // Calculate fuel paid
    const fuelPaid = fuelFills
      .filter((fill) => fill.payer_member_id === member.id)
      .reduce((sum, fill) => sum + fill.amount, 0);

    // Calculate trip usage
    const tripUsage = trips
      .filter((trip) => trip.passenger_member_ids.includes(member.id))
      .reduce((sum, trip) => {
        const tripCost = trip.distance_km * costPerKm;
        const costPerPassenger = tripCost / trip.passenger_member_ids.length;
        return sum + costPerPassenger;
      }, 0);

    // Calculate settlements received
    const settlementsReceived = settlements
      .filter((settlement) => settlement.to_member_id === member.id)
      .reduce((sum, settlement) => sum + settlement.amount, 0);

    // Calculate settlements sent
    const settlementsSent = settlements
      .filter((settlement) => settlement.from_member_id === member.id)
      .reduce((sum, settlement) => sum + settlement.amount, 0);

    // Calculate net balance
    const netBalance =
      fuelPaid - tripUsage + settlementsReceived - settlementsSent;

    return {
      member,
      fuelPaid,
      tripUsage,
      settlementsReceived,
      settlementsSent,
      netBalance,
    };
  });
}
