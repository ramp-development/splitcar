"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import {
  createSettlementColumns,
  Settlement,
} from "@/components/settlements/columns";

type Member = {
  id: string;
  name: string;
  archived: boolean;
  user_id: string | null;
  is_guest: boolean;
};

type Car = {
  id: string;
  currency: string;
};

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    fromMemberId: "",
    toMemberId: "",
    amount: "",
  });
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
          .select("id, currency")
          .eq("owner_id", user.id)
          .single();

        if (!carData) {
          router.push("/dashboard");
          return;
        }

        setCar(carData);

        // Get members
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("id, name, archived, user_id, is_guest")
          .eq("car_id", carData.id)
          .order("name");

        if (membersError) throw membersError;
        setMembers(membersData || []);

        // Get settlements with member names
        const { data: settlementsData, error: settlementsError } =
          await supabase
            .from("settlements")
            .select(
              `
            *,
            from_member:members!settlements_from_member_id_fkey (
              name
            ),
            to_member:members!settlements_to_member_id_fkey (
              name
            )
          `
            )
            .eq("car_id", carData.id)
            .order("created_at", { ascending: false });

        if (settlementsError) throw settlementsError;

        // Transform data to include member names
        const transformedSettlements = (settlementsData || []).map(
          (settlement) => ({
            id: settlement.id,
            car_id: settlement.car_id,
            from_member_id: settlement.from_member_id,
            to_member_id: settlement.to_member_id,
            amount: settlement.amount,
            created_at: settlement.created_at,
            from_member_name: settlement.from_member?.name || "Unknown",
            to_member_name: settlement.to_member?.name || "Unknown",
          })
        );

        setSettlements(transformedSettlements);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load settlements");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router]);

  async function handleSubmitSettlement(e: React.FormEvent) {
    e.preventDefault();
    if (!car) return;

    if (settlementForm.fromMemberId === settlementForm.toMemberId) {
      toast.error("From and To members must be different");
      return;
    }

    const supabase = createClient();

    try {
      // Add new settlement
      const { error } = await supabase.from("settlements").insert({
        car_id: car.id,
        from_member_id: settlementForm.fromMemberId,
        to_member_id: settlementForm.toMemberId,
        amount: parseFloat(settlementForm.amount),
      });

      if (error) throw error;

      toast.success("Settlement recorded!");

      // Reload settlements
      const { data: settlementsData } = await supabase
        .from("settlements")
        .select(
          `
          *,
          from_member:members!settlements_from_member_id_fkey (
            name
          ),
          to_member:members!settlements_to_member_id_fkey (
            name
          )
        `
        )
        .eq("car_id", car.id)
        .order("created_at", { ascending: false });

      const transformedSettlements = (settlementsData || []).map(
        (settlement) => ({
          id: settlement.id,
          car_id: settlement.car_id,
          from_member_id: settlement.from_member_id,
          to_member_id: settlement.to_member_id,
          amount: settlement.amount,
          created_at: settlement.created_at,
          from_member_name: settlement.from_member?.name || "Unknown",
          to_member_name: settlement.to_member?.name || "Unknown",
        })
      );

      setSettlements(transformedSettlements);
      setDialogOpen(false);
      setSettlementForm({ fromMemberId: "", toMemberId: "", amount: "" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add settlement"
      );
    }
  }

  async function handleDeleteSettlement(settlementId: string) {
    if (!confirm("Are you sure you want to delete this settlement?")) return;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("settlements")
        .delete()
        .eq("id", settlementId);

      if (error) throw error;

      toast.success("Settlement deleted");
      setSettlements(settlements.filter((s) => s.id !== settlementId));
    } catch (error) {
      toast.error("Failed to delete settlement");
      console.error(error);
    }
  }

  const columns = createSettlementColumns(
    car?.currency || "CAD",
    handleDeleteSettlement
  );

  // Filter out archived members from selection
  const activeMembers = members.filter((m) => !m.archived);

  // Find current user's member ID
  const currentUserMemberId = members.find((m) => m.user_id === user?.id)?.id;

  // Group members by type
  const currentUser = activeMembers.find((m) => m.user_id === user?.id);
  const otherMembers = activeMembers
    .filter((m) => m.user_id !== user?.id && !m.is_guest)
    .sort((a, b) => a.name.localeCompare(b.name));
  const guestMembers = activeMembers
    .filter((m) => m.is_guest)
    .sort((a, b) => a.name.localeCompare(b.name));

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
      data={settlements}
      filterColumn="from_member_name"
      filterPlaceholder="Filter by sender..."
      toolbarActions={
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSettlementForm({
                fromMemberId: "",
                toMemberId: "",
                amount: "",
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                // Auto-select current user as sender when opening dialog
                if (currentUserMemberId) {
                  setSettlementForm({
                    fromMemberId: currentUserMemberId,
                    toMemberId: "",
                    amount: "",
                  });
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Settlement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Settlement</DialogTitle>
              <DialogDescription>
                Record a payment from one member to another
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitSettlement} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from">From (Sender)</Label>
                <Select
                  value={settlementForm.fromMemberId}
                  onValueChange={(value) =>
                    setSettlementForm({
                      ...settlementForm,
                      fromMemberId: value,
                    })
                  }
                  required
                >
                  <SelectTrigger id="from">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser && (
                      <SelectGroup>
                        <SelectLabel>You</SelectLabel>
                        <SelectItem value={currentUser.id}>
                          {currentUser.name}
                        </SelectItem>
                      </SelectGroup>
                    )}
                    {otherMembers.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Members</SelectLabel>
                        {otherMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {guestMembers.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Guests</SelectLabel>
                        {guestMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">To (Recipient)</Label>
                <Select
                  value={settlementForm.toMemberId}
                  onValueChange={(value) =>
                    setSettlementForm({ ...settlementForm, toMemberId: value })
                  }
                  required
                >
                  <SelectTrigger id="to">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUser && (
                      <SelectGroup>
                        <SelectLabel>You</SelectLabel>
                        <SelectItem value={currentUser.id}>
                          {currentUser.name}
                        </SelectItem>
                      </SelectGroup>
                    )}
                    {otherMembers.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Members</SelectLabel>
                        {otherMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {guestMembers.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Guests</SelectLabel>
                        {guestMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({car?.currency || "CAD"})</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={settlementForm.amount}
                  onChange={(e) =>
                    setSettlementForm({
                      ...settlementForm,
                      amount: e.target.value,
                    })
                  }
                  required
                  placeholder="50.00"
                />
              </div>
              <Button type="submit" className="w-full">
                Record Settlement
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  );
}
