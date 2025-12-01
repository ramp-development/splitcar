"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { getUserCar } from "@/lib/queries/cars";
import { getCarMembers, getCarFuelFills, getCarTrips, getCarSettlements } from "@/lib/queries";
import { calculateMemberBalances } from "@/lib/services";
import { sortMembersByPriority } from "@/lib/services/member-sorter";
import { Car, Member } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { createBalanceColumns, Balance } from "@/components/balances/columns";

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

        // Get all data using query functions
        const members = await getCarMembers(supabase, user.id);
        const activeMembers = members.filter((m) => !m.archived);
        const fuelFills = await getCarFuelFills(supabase, user.id);
        const trips = await getCarTrips(supabase, user.id);
        const settlements = await getCarSettlements(supabase, user.id);

        // Calculate balances using service
        const memberBalances = calculateMemberBalances(
          activeMembers,
          fuelFills,
          trips,
          settlements,
          carData
        );

        // Transform to Balance type for table and sort
        const balancesForTable: Balance[] = memberBalances.map((mb) => ({
          member_id: mb.member.id,
          member_name: mb.member.name,
          fuel_paid: mb.fuelPaid,
          trip_usage: mb.tripUsage,
          settlements_received: mb.settlementsReceived,
          settlements_sent: mb.settlementsSent,
          net_balance: mb.netBalance,
          is_guest: mb.member.is_guest || false,
          user_id: mb.member.user_id,
        }));

        // Sort using service
        const sortedBalances = sortMembersByPriority(
          balancesForTable.map((b) => ({
            id: b.member_id,
            name: b.member_name,
            is_guest: b.is_guest,
            user_id: b.user_id,
          } as Member)),
          user.id
        );

        // Re-map to Balance[] in sorted order
        const finalBalances = sortedBalances.map((member) =>
          balancesForTable.find((b) => b.member_id === member.id)!
        );

        setBalances(finalBalances);
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
