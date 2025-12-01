"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { getUserCar } from "@/lib/queries/cars";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, ChevronDownIcon } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { createTripColumns, TripTableRow } from "@/components/trips/columns";

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
  distance_unit: string;
  km_per_litre: number;
  default_price_per_litre: number;
};

export default function TripsPage() {
  const [trips, setTrips] = useState<TripTableRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripTableRow | null>(null);
  const [tripForm, setTripForm] = useState({
    name: "",
    distanceKm: "",
    passengerIds: [] as string[],
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
        // Get user's car using function (bypasses RLS)
        const carData = await getUserCar(supabase, user.id);
        if (!carData) {
          router.push("/dashboard");
          return;
        }

        setCar({
          id: carData.id,
          currency: carData.currency || "CAD",
          distance_unit: carData.distance_unit || "km",
          km_per_litre: carData.km_per_litre || 0,
          default_price_per_litre: carData.default_price_per_litre || 0,
        });

        // Get members using function (bypasses RLS)
        const { data: allMembers, error: membersError } = await supabase.rpc(
          "get_car_members",
          { p_user_id: user.id }
        );

        if (membersError) throw membersError;
        const membersData = allMembers || [];
        setMembers(membersData);

        // Get trips using function (bypasses RLS)
        const { data: tripsData, error: tripsError } = await supabase.rpc(
          "get_car_trips",
          { p_user_id: user.id }
        );

        if (tripsError) throw tripsError;

        // Transform trips data
        const transformedTrips = await Promise.all(
          (tripsData || []).map(async (trip: TripTableRow) => {
            // Get passenger names
            const passengerNames = (trip.passengers || [])
              .map((id: string) => {
                const member = membersData?.find((m: Member) => m.id === id);
                return member?.name || "Unknown";
              })
              .filter(Boolean);

            // Calculate costs
            const costPerKm =
              (carData.default_price_per_litre || 0) / (carData.km_per_litre || 1);
            const totalCost = trip.distance * costPerKm;
            const passengerCount = trip.passengers?.length || 1;
            const costPerPassenger = totalCost / passengerCount;

            return {
              id: trip.id,
              car_id: trip.car_id,
              name: trip.name,
              distance: trip.distance,
              passengers: trip.passengers || [],
              date: trip.date,
              created_at: trip.created_at,
              passenger_names: passengerNames,
              cost_per_passenger: costPerPassenger,
              total_cost: totalCost,
            };
          })
        );

        setTrips(transformedTrips);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load trips");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, router]);

  async function handleSubmitTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!car) return;

    if (tripForm.passengerIds.length === 0) {
      toast.error("Please select at least one passenger");
      return;
    }

    const supabase = createClient();

    try {
      if (editingTrip) {
        // Update existing trip
        const { error } = await supabase
          .from("trips")
          .update({
            name: tripForm.name || null,
            distance: parseFloat(tripForm.distanceKm),
            passengers: tripForm.passengerIds,
            date: tripForm.date.toISOString().split("T")[0],
          })
          .eq("id", editingTrip.id);

        if (error) throw error;

        toast.success("Trip updated!");
      } else {
        // Add new trip
        const { error } = await supabase.from("trips").insert({
          car_id: car.id,
          name: tripForm.name || null,
          distance: parseFloat(tripForm.distanceKm),
          passengers: tripForm.passengerIds,
          date: tripForm.date.toISOString().split("T")[0],
        });

        if (error) throw error;

        toast.success("Trip added!");
      }

      // Reload trips
      const { data: tripsData } = await supabase
        .from("trips")
        .select("*")
        .eq("car_id", car.id)
        .order("date", { ascending: false });

      const transformedTrips = await Promise.all(
        (tripsData || []).map(async (trip) => {
          const passengerNames = (trip.passengers || [])
            .map((id: string) => {
              const member = members.find((m) => m.id === id);
              return member?.name || "Unknown";
            })
            .filter(Boolean);

          const costPerKm =
            car.default_price_per_litre / car.km_per_litre;
          const totalCost = trip.distance * costPerKm;
          const passengerCount = trip.passengers?.length || 1;
          const costPerPassenger = totalCost / passengerCount;

          return {
            id: trip.id,
            car_id: trip.car_id,
            name: trip.name,
            distance: trip.distance,
            passengers: trip.passengers || [],
            date: trip.date,
            created_at: trip.created_at,
            passenger_names: passengerNames,
            cost_per_passenger: costPerPassenger,
            total_cost: totalCost,
          };
        })
      );

      setTrips(transformedTrips);
      setDialogOpen(false);
      setEditingTrip(null);
      setTripForm({
        name: "",
        distanceKm: "",
        passengerIds: [],
        date: new Date(),
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingTrip
            ? "Failed to update trip"
            : "Failed to add trip"
      );
    }
  }

  function handleEditTrip(trip: TripTableRow) {
    setEditingTrip(trip);
    setTripForm({
      name: trip.name || "",
      distanceKm: trip.distance.toString(),
      passengerIds: trip.passengers,
      date: new Date(trip.date),
    });
    setDialogOpen(true);
  }

  async function handleDeleteTrip(tripId: string) {
    if (!confirm("Are you sure you want to delete this trip?")) return;

    const supabase = createClient();

    try {
      const { error } = await supabase.from("trips").delete().eq("id", tripId);

      if (error) throw error;

      toast.success("Trip deleted");
      setTrips(trips.filter((t) => t.id !== tripId));
    } catch (error) {
      toast.error("Failed to delete trip");
      console.error(error);
    }
  }

  function togglePassenger(memberId: string) {
    setTripForm((prev) => ({
      ...prev,
      passengerIds: prev.passengerIds.includes(memberId)
        ? prev.passengerIds.filter((id) => id !== memberId)
        : [...prev.passengerIds, memberId],
    }));
  }

  const columns = createTripColumns(
    car?.currency || "CAD",
    car?.distance_unit || "km",
    handleEditTrip,
    handleDeleteTrip
  );

  // Filter out archived members from selection
  const activeMembers = members.filter((m) => !m.archived);

  // Find current user's member ID
  const currentUserMemberId = members.find((m) => m.user_id === user?.id)?.id;

  // Sort passengers: current user first, then members, then guests
  const sortedPassengers = activeMembers.sort((a, b) => {
    // Current user always first
    if (a.user_id === user?.id) return -1;
    if (b.user_id === user?.id) return 1;

    // Then members before guests
    if (!a.is_guest && b.is_guest) return -1;
    if (a.is_guest && !b.is_guest) return 1;

    // Within same group, sort alphabetically
    return a.name.localeCompare(b.name);
  });

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
      data={trips}
      filterColumn="name"
      filterPlaceholder="Filter by name..."
      toolbarActions={
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingTrip(null);
              setTripForm({
                name: "",
                distanceKm: "",
                passengerIds: [],
                date: new Date(),
              });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                // Auto-select current user as passenger when opening dialog
                if (!editingTrip && currentUserMemberId) {
                  setTripForm({
                    name: "",
                    distanceKm: "",
                    passengerIds: [currentUserMemberId],
                    date: new Date(),
                  });
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Trip
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTrip ? "Edit Trip" : "Add New Trip"}
              </DialogTitle>
              <DialogDescription>
                {editingTrip
                  ? "Update trip details"
                  : "Record a new trip with distance and passengers"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitTrip} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trip-name">Trip Name (optional)</Label>
                <Input
                  id="trip-name"
                  type="text"
                  value={tripForm.name}
                  onChange={(e) =>
                    setTripForm({
                      ...tripForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Weekend getaway, Costco run"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">
                  Distance ({car?.distance_unit || "km"})
                </Label>
                <Input
                  id="distance"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={tripForm.distanceKm}
                  onChange={(e) =>
                    setTripForm({
                      ...tripForm,
                      distanceKm: e.target.value,
                    })
                  }
                  required
                  placeholder="100.0"
                />
              </div>

              <div className="space-y-2">
                <Label>Passengers *</Label>
                <div className="space-y-2 rounded-md border p-3">
                  {sortedPassengers.map((member, index) => {
                    // Check if we need to add a separator before guests
                    const prevMember =
                      index > 0 ? sortedPassengers[index - 1] : null;
                    const showSeparator =
                      prevMember && !prevMember.is_guest && member.is_guest;

                    return (
                      <React.Fragment key={member.id}>
                        {showSeparator && (
                          <div className="py-1">
                            <Separator />
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`passenger-${member.id}`}
                            checked={tripForm.passengerIds.includes(member.id)}
                            onCheckedChange={() => togglePassenger(member.id)}
                          />
                          <Label
                            htmlFor={`passenger-${member.id}`}
                            className="cursor-pointer font-normal"
                          >
                            {member.name}
                            {member.user_id === user?.id && (
                              <span className="ml-1 text-muted-foreground">
                                (You)
                              </span>
                            )}
                          </Label>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tripForm.passengerIds.length} passenger
                  {tripForm.passengerIds.length !== 1 ? "s" : ""} selected
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip-date">Date</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="trip-date"
                      className="w-full justify-between font-normal"
                    >
                      {tripForm.date.toLocaleDateString()}
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={tripForm.date}
                      captionLayout="dropdown"
                      onSelect={(date) => {
                        if (date) {
                          setTripForm({ ...tripForm, date });
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
                {editingTrip ? "Update Trip" : "Add Trip"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    />
  );
}
