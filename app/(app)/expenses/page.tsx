"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { getUserCar } from "@/lib/queries/cars";
import { getCarMembers } from "@/lib/queries/members";
import { getCarExpenses } from "@/lib/queries/expenses";
import { addExpense, updateExpense, deleteExpense } from "@/lib/actions";
import {
  groupMembersForSelect,
  MemberGroups,
} from "@/lib/services/member-sorter";
import { CarFromFunction } from "@/lib/types";
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
import {
  createExpenseColumns,
  ExpenseTableRow,
} from "@/components/expenses/columns";

export default function ExpenseTableRowsPage() {
  const [fuelFills, setExpenseTableRows] = useState<ExpenseTableRow[]>([]);
  const [car, setCar] = useState<CarFromFunction | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpenseTableRow, setEditingExpenseTableRow] =
    useState<ExpenseTableRow | null>(null);
  const [fuelFillForm, setExpenseTableRowForm] = useState({
    payerMemberId: "",
    amount: "",
    date: new Date(),
  });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Member selection groups
  const [memberGroups, setMemberGroups] = useState<MemberGroups>({
    currentUser: null,
    ownerMembers: [],
    guestMembers: [],
    activeMembers: [],
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const supabase = createClient();

      try {
        // Get user's car
        const carData = await getUserCar(supabase, user.id);
        if (!carData) {
          router.push("/dashboard");
          return;
        }

        setCar(carData as CarFromFunction);

        // Get members and expenses
        const [members, expenses] = await Promise.all([
          getCarMembers(supabase, user.id),
          getCarExpenses(supabase, user.id),
        ]);

        // Group members for select dropdown
        setMemberGroups(groupMembersForSelect(members, user.id));

        // Filter only fuel expenses and transform for table using helper
        const fuelExpenses = expenses.filter(
          (e) => e.type.toLowerCase() === "fuel"
        );
        setExpenseTableRows(fuelExpenses);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load fuel fills");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router]);

  async function handleSubmitExpenseTableRow(e: React.FormEvent) {
    e.preventDefault();
    if (!car) return;

    try {
      if (editingExpenseTableRow) {
        // Update existing fuel fill
        await updateExpense(editingExpenseTableRow.id, {
          payer_id: fuelFillForm.payerMemberId,
          amount: parseFloat(fuelFillForm.amount),
          date: fuelFillForm.date,
        });

        toast.success("Fuel fill updated!");
      } else {
        // Add new fuel fill
        await addExpense({
          car_id: car.id,
          payer_id: fuelFillForm.payerMemberId,
          type: "Fuel",
          amount: parseFloat(fuelFillForm.amount),
          date: fuelFillForm.date,
        });

        toast.success("Fuel fill added!");
      }

      // Reload data
      const supabase = createClient();
      const expenses = await getCarExpenses(supabase, user!.id);
      const fuelExpenses = expenses.filter(
        (e) => e.type.toLowerCase() === "fuel"
      );
      setExpenseTableRows(fuelExpenses);
      setDialogOpen(false);
      setEditingExpenseTableRow(null);
      setExpenseTableRowForm({
        payerMemberId: "",
        amount: "",
        date: new Date(),
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingExpenseTableRow
            ? "Failed to update fuel fill"
            : "Failed to add fuel fill"
      );
    }
  }

  function handleEditExpenseTableRow(fuelFill: ExpenseTableRow) {
    setEditingExpenseTableRow(fuelFill);
    setExpenseTableRowForm({
      payerMemberId: fuelFill.payer_id,
      amount: fuelFill.amount.toString(),
      date: new Date(fuelFill.date),
    });
    setDialogOpen(true);
  }

  async function handleDeleteExpenseTableRow(fuelFillId: string) {
    if (!confirm("Are you sure you want to delete this fuel fill?")) return;

    try {
      await deleteExpense(fuelFillId);
      toast.success("Fuel fill deleted");
      setExpenseTableRows(fuelFills.filter((f) => f.id !== fuelFillId));
    } catch (error) {
      toast.error("Failed to delete fuel fill");
      console.error(error);
    }
  }

  const columns = createExpenseColumns(
    car?.currency || "CAD",
    handleEditExpenseTableRow,
    handleDeleteExpenseTableRow
  );

  const currentUserMemberId = memberGroups.currentUser?.id;

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
              setEditingExpenseTableRow(null);
              setExpenseTableRowForm({
                payerMemberId: "",
                amount: "",
                date: new Date(),
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                // Auto-select current user when opening dialog for new entry
                if (!editingExpenseTableRow && currentUserMemberId) {
                  setExpenseTableRowForm({
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
                {editingExpenseTableRow
                  ? "Edit Fuel Fill"
                  : "Add New Fuel Fill"}
              </DialogTitle>
              <DialogDescription>
                {editingExpenseTableRow
                  ? "Update fuel fill details"
                  : "Record a new fuel purchase"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitExpenseTableRow} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payer">Paid By</Label>
                <Select
                  value={fuelFillForm.payerMemberId}
                  onValueChange={(value) =>
                    setExpenseTableRowForm({
                      ...fuelFillForm,
                      payerMemberId: value,
                    })
                  }
                  required
                >
                  <SelectTrigger id="payer">
                    <SelectValue placeholder="Select member" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberGroups.currentUser && (
                      <SelectGroup>
                        <SelectLabel>You</SelectLabel>
                        <SelectItem value={memberGroups.currentUser.id}>
                          {memberGroups.currentUser.name || "You"}
                        </SelectItem>
                      </SelectGroup>
                    )}
                    {memberGroups.ownerMembers.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Owners</SelectLabel>
                        {memberGroups.ownerMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {memberGroups.guestMembers.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Guests</SelectLabel>
                        {memberGroups.guestMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name || "Unknown"}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">
                  Amount ({car?.currency || "CAD"})
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={fuelFillForm.amount}
                  onChange={(e) =>
                    setExpenseTableRowForm({
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
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={fuelFillForm.date}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        if (date) {
                          setExpenseTableRowForm({ ...fuelFillForm, date });
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
                {editingExpenseTableRow ? "Update Fuel Fill" : "Add Fuel Fill"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  );
}
