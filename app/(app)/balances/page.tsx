"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { getUserCar } from "@/lib/queries/car";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { createBalanceColumns, Balance } from "@/components/balances/columns";
import { Member } from "@/components/members/columns";

type Car = {
  id: string;
  currency: string;
  efficiency_km_per_litre: number;
  avg_price_per_litre: number;
};

type FuelFill = {
  payer_member_id: string;
  amount: number;
};

type Trip = {
  distance_km: number;
  passenger_member_ids: string[];
};

type Settlement = {
  from_member_id: string;
  to_member_id: string;
  amount: number;
};

export default function BalancesPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const supabase = createClient();

      try {
        // Get user's car using function (bypasses RLS)
        const carData = await getUserCar(supabase, user.id);
        if (!carData) {
          router.push("/dashboard");
          return;
        }

        setCar(carData);

        // Get members using function (bypasses RLS)
        const { data: allMembers, error: membersError } = await supabase.rpc(
          "get_car_members",
          { p_user_id: user.id }
        );

        if (membersError) throw membersError;
        const membersData = (allMembers || []).filter(
          (m: Member) => !m.archived
        );

        // Get fuel fills using function (bypasses RLS)
        const { data: fuelFillsData, error: fuelFillsError } =
          await supabase.rpc("get_car_fuel_fills", { p_user_id: user.id });

        if (fuelFillsError) throw fuelFillsError;

        // Get trips using function (bypasses RLS)
        const { data: tripsData, error: tripsError } = await supabase.rpc(
          "get_car_trips",
          { p_user_id: user.id }
        );

        if (tripsError) throw tripsError;

        // Get settlements using function (bypasses RLS)
        const { data: settlementsData, error: settlementsError } =
          await supabase.rpc("get_car_settlements", { p_user_id: user.id });

        if (settlementsError) throw settlementsError;

        // Calculate balances
        const costPerKm =
          carData.avg_price_per_litre / carData.efficiency_km_per_litre;

        const calculatedBalances = (membersData || []).map((member: Member) => {
          // Calculate fuel paid
          const fuelPaid = (fuelFillsData || [])
            .filter((fill: FuelFill) => fill.payer_member_id === member.id)
            .reduce((sum: number, fill: FuelFill) => sum + fill.amount, 0);

          // Calculate trip usage
          const tripUsage = (tripsData || [])
            .filter((trip: Trip) =>
              trip.passenger_member_ids.includes(member.id)
            )
            .reduce((sum: number, trip: Trip) => {
              const tripCost = trip.distance_km * costPerKm;
              const costPerPassenger =
                tripCost / trip.passenger_member_ids.length;
              return sum + costPerPassenger;
            }, 0);

          // Calculate settlements received
          const settlementsReceived = (settlementsData || [])
            .filter(
              (settlement: Settlement) => settlement.to_member_id === member.id
            )
            .reduce(
              (sum: number, settlement: Settlement) => sum + settlement.amount,
              0
            );

          // Calculate settlements sent
          const settlementsSent = (settlementsData || [])
            .filter(
              (settlement: Settlement) =>
                settlement.from_member_id === member.id
            )
            .reduce(
              (sum: number, settlement: Settlement) => sum + settlement.amount,
              0
            );

          // Calculate net balance
          const netBalance =
            fuelPaid - tripUsage + settlementsReceived - settlementsSent;

          return {
            member_id: member.id,
            member_name: member.name,
            fuel_paid: fuelPaid,
            trip_usage: tripUsage,
            settlements_received: settlementsReceived,
            settlements_sent: settlementsSent,
            net_balance: netBalance,
            is_guest: member.is_guest,
            user_id: member.user_id,
          };
        });

        // Sort balances: current user first, then non-guests alphabetically, then guests alphabetically
        const sortedBalances = calculatedBalances.sort(
          (a: Balance, b: Balance) => {
            // Current user first
            if (a.user_id === user.id) return -1;
            if (b.user_id === user.id) return 1;

            // Then members before guests
            if (!a.is_guest && b.is_guest) return -1;
            if (a.is_guest && !b.is_guest) return 1;

            // Within same group, sort alphabetically
            return a.member_name.localeCompare(b.member_name);
          }
        );

        setBalances(sortedBalances);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load balances");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router]);

  const columns = createBalanceColumns(car?.currency || "CAD");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={balances}
      filterColumn="member_name"
      filterPlaceholder="Filter by member..."
      toolbarActions={
        <Button onClick={() => router.push("/settlements")}>
          <Plus className="mr-2 h-4 w-4" />
          Record Settlement
        </Button>
      }
    />
  );
}
