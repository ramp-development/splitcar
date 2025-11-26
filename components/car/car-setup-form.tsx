"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type CarSetupFormProps = {
  userId: string;
  onSuccess: () => void;
};

export function CarSetupForm({ userId, onSuccess }: CarSetupFormProps) {
  const [carForm, setCarForm] = useState({
    name: "",
    efficiencyKmPerLitre: "",
    avgPricePerLitre: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSubmitting(true);

    try {
      // Get user's name
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", userId)
        .single();

      // Create car
      const { data: carData, error: carError } = await supabase
        .from("cars")
        .insert({
          owner_id: userId,
          name: carForm.name,
          efficiency_km_per_litre: parseFloat(carForm.efficiencyKmPerLitre),
          avg_price_per_litre: parseFloat(carForm.avgPricePerLitre),
          currency: "CAD",
          distance_unit: "km",
          fuel_unit: "litre",
        })
        .select()
        .single();

      if (carError) throw carError;

      // Automatically add owner as a member
      const { error: memberError } = await supabase.from("members").insert({
        car_id: carData.id,
        name: userData?.name || "Owner",
        user_id: userId,
        is_guest: false,
      });

      if (memberError) throw memberError;

      toast.success("Car created successfully!");
      setCarForm({ name: "", efficiencyKmPerLitre: "", avgPricePerLitre: "" });
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create car");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Car Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="My Honda Civic"
          value={carForm.name}
          onChange={(e) => setCarForm({ ...carForm, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="efficiency">Fuel Efficiency (km per litre)</Label>
        <Input
          id="efficiency"
          type="number"
          step="0.1"
          placeholder="12.5"
          value={carForm.efficiencyKmPerLitre}
          onChange={(e) =>
            setCarForm({ ...carForm, efficiencyKmPerLitre: e.target.value })
          }
          required
        />
        <p className="text-xs text-muted-foreground">
          How many kilometers your car travels per litre of fuel
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Average Fuel Price (CAD per litre)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          placeholder="1.75"
          value={carForm.avgPricePerLitre}
          onChange={(e) =>
            setCarForm({ ...carForm, avgPricePerLitre: e.target.value })
          }
          required
        />
        <p className="text-xs text-muted-foreground">
          Current average price per litre in your area
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating..." : "Create Car"}
      </Button>
    </form>
  );
}
