"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Plus, ChevronDownIcon } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { createFuelFillColumns, FuelFill } from "@/components/fuel-fills/columns";

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

export default function FuelFillsPage() {
  const [fuelFills, setFuelFills] = useState<FuelFill[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFuelFill, setEditingFuelFill] = useState<FuelFill | null>(null);
  const [fuelFillForm, setFuelFillForm] = useState({
    payerMemberId: "",
    amount: "",
    date: new Date(),
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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

        // Get members (non-archived)
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("id, name, archived, user_id, is_guest")
          .eq("car_id", carData.id)
          .order("name");

        if (membersError) throw membersError;
        setMembers(membersData || []);

        // Get fuel fills with member names
        const { data: fuelFillsData, error: fuelFillsError } = await supabase
          .from("fuel_fills")
          .select(
            `
            *,
            members!fuel_fills_payer_member_id_fkey (
              name
            )
          `
          )
          .eq("car_id", carData.id)
          .order("date", { ascending: false });

        if (fuelFillsError) throw fuelFillsError;

        // Transform data to include payer_name
        const transformedFuelFills = (fuelFillsData || []).map((fill) => ({
          id: fill.id,
          car_id: fill.car_id,
          payer_member_id: fill.payer_member_id,
          amount: fill.amount,
          date: fill.date,
          created_at: fill.created_at,
          payer_name: fill.members?.name || "Unknown",
        }));

        setFuelFills(transformedFuelFills);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load fuel fills");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router]);

  async function handleSubmitFuelFill(e: React.FormEvent) {
    e.preventDefault();
    if (!car) return;

    const supabase = createClient();

    try {
      if (editingFuelFill) {
        // Update existing fuel fill
        const { error } = await supabase
          .from("fuel_fills")
          .update({
            payer_member_id: fuelFillForm.payerMemberId,
            amount: parseFloat(fuelFillForm.amount),
            date: fuelFillForm.date.toISOString().split("T")[0],
          })
          .eq("id", editingFuelFill.id);

        if (error) throw error;

        toast.success("Fuel fill updated!");

        // Reload fuel fills
        const { data: fuelFillsData } = await supabase
          .from("fuel_fills")
          .select(
            `
            *,
            members!fuel_fills_payer_member_id_fkey (
              name
            )
          `
          )
          .eq("car_id", car.id)
          .order("date", { ascending: false });

        const transformedFuelFills = (fuelFillsData || []).map((fill) => ({
          id: fill.id,
          car_id: fill.car_id,
          payer_member_id: fill.payer_member_id,
          amount: fill.amount,
          date: fill.date,
          created_at: fill.created_at,
          payer_name: fill.members?.name || "Unknown",
        }));

        setFuelFills(transformedFuelFills);
      } else {
        // Add new fuel fill
        const { error } = await supabase.from("fuel_fills").insert({
          car_id: car.id,
          payer_member_id: fuelFillForm.payerMemberId,
          amount: parseFloat(fuelFillForm.amount),
          date: fuelFillForm.date.toISOString().split("T")[0],
        });

        if (error) throw error;

        toast.success("Fuel fill added!");

        // Reload fuel fills
        const { data: fuelFillsData } = await supabase
          .from("fuel_fills")
          .select(
            `
            *,
            members!fuel_fills_payer_member_id_fkey (
              name
            )
          `
          )
          .eq("car_id", car.id)
          .order("date", { ascending: false });

        const transformedFuelFills = (fuelFillsData || []).map((fill) => ({
          id: fill.id,
          car_id: fill.car_id,
          payer_member_id: fill.payer_member_id,
          amount: fill.amount,
          date: fill.date,
          created_at: fill.created_at,
          payer_name: fill.members?.name || "Unknown",
        }));

        setFuelFills(transformedFuelFills);
      }

      setDialogOpen(false);
      setEditingFuelFill(null);
      setFuelFillForm({ payerMemberId: "", amount: "", date: new Date() });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingFuelFill
            ? "Failed to update fuel fill"
            : "Failed to add fuel fill"
      );
    }
  }

  function handleEditFuelFill(fuelFill: FuelFill) {
    setEditingFuelFill(fuelFill);
    setFuelFillForm({
      payerMemberId: fuelFill.payer_member_id,
      amount: fuelFill.amount.toString(),
      date: new Date(fuelFill.date),
    });
    setDialogOpen(true);
  }

  async function handleDeleteFuelFill(fuelFillId: string) {
    if (!confirm("Are you sure you want to delete this fuel fill?")) return;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("fuel_fills")
        .delete()
        .eq("id", fuelFillId);

      if (error) throw error;

      toast.success("Fuel fill deleted");
      setFuelFills(fuelFills.filter((f) => f.id !== fuelFillId));
    } catch (error) {
      toast.error("Failed to delete fuel fill");
      console.error(error);
    }
  }

  const columns = createFuelFillColumns(
    car?.currency || "CAD",
    handleEditFuelFill,
    handleDeleteFuelFill
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
      data={fuelFills}
      filterColumn="payer_name"
      filterPlaceholder="Filter by payer..."
      toolbarActions={
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingFuelFill(null);
              setFuelFillForm({ payerMemberId: "", amount: "", date: new Date() });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                // Auto-select current user when opening dialog for new entry
                if (!editingFuelFill && currentUserMemberId) {
                  setFuelFillForm({
                    payerMemberId: currentUserMemberId,
                    amount: "",
                    date: new Date(),
                  });
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Fuel Fill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFuelFill ? "Edit Fuel Fill" : "Add New Fuel Fill"}
              </DialogTitle>
              <DialogDescription>
                {editingFuelFill
                  ? "Update fuel fill details"
                  : "Record a new fuel purchase"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitFuelFill} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payer">Paid By</Label>
                <Select
                  value={fuelFillForm.payerMemberId}
                  onValueChange={(value) =>
                    setFuelFillForm({ ...fuelFillForm, payerMemberId: value })
                  }
                  required
                >
                  <SelectTrigger id="payer">
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
                  value={fuelFillForm.amount}
                  onChange={(e) =>
                    setFuelFillForm({
                      ...fuelFillForm,
                      amount: e.target.value,
                    })
                  }
                  required
                  placeholder="50.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="date"
                      className="w-full justify-between font-normal"
                    >
                      {fuelFillForm.date.toLocaleDateString()}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fuelFillForm.date}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        if (date) {
                          setFuelFillForm({ ...fuelFillForm, date });
                          setDatePickerOpen(false);
                        }
                      }}
                      disabled={(date) => date > new Date()}
                      fromYear={2020}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="submit" className="w-full">
                {editingFuelFill ? "Update Fuel Fill" : "Add Fuel Fill"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  );
}
