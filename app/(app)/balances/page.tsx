"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { createBalanceColumns, Balance } from "@/components/balances/columns";

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
        // Get user's car
        const { data: carData } = await supabase
          .from("cars")
          .select("id, currency, efficiency_km_per_litre, avg_price_per_litre")
          .eq("owner_id", user.id)
          .single();

        if (!carData) {
          router.push("/dashboard");
          return;
        }

        setCar(carData);

        // Get members (non-archived)
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("id, name, archived")
          .eq("car_id", carData.id)
          .eq("archived", false)
          .order("name");

        if (membersError) throw membersError;

        // Get fuel fills
        const { data: fuelFillsData, error: fuelFillsError } = await supabase
          .from("fuel_fills")
          .select("payer_member_id, amount")
          .eq("car_id", carData.id);

        if (fuelFillsError) throw fuelFillsError;

        // Get trips
        const { data: tripsData, error: tripsError } = await supabase
          .from("trips")
          .select("distance_km, passenger_member_ids")
          .eq("car_id", carData.id);

        if (tripsError) throw tripsError;

        // Get settlements
        const { data: settlementsData, error: settlementsError } =
          await supabase
            .from("settlements")
            .select("from_member_id, to_member_id, amount")
            .eq("car_id", carData.id);

        if (settlementsError) throw settlementsError;

        // Calculate balances
        const costPerKm =
          carData.avg_price_per_litre / carData.efficiency_km_per_litre;

        const calculatedBalances = (membersData || []).map((member) => {
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
              (settlement: Settlement) =>
                settlement.to_member_id === member.id
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
          };
        });

        setBalances(calculatedBalances);
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
