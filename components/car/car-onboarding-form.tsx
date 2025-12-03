"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";

type CarOnboardingFormProps = {
  userId: string;
  onSuccess?: () => void;
};

export function CarOnboardingForm({
  userId,
  onSuccess,
}: CarOnboardingFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [carForm, setCarForm] = useState({
    name: "",
    currency: "CAD",
    kmPerLitre: "",
    defaultPricePerLitre: "",
  });

  async function handleCreateCar(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    const supabase = createClient();

    try {
      // Create car
      const { data: car, error: carError } = await supabase
        .from("cars")
        .insert({
          name: carForm.name,
          currency: carForm.currency,
          km_per_litre: parseFloat(carForm.kmPerLitre) || null,
          default_price_per_litre:
            parseFloat(carForm.defaultPricePerLitre) || null,
        })
        .select()
        .single();

      if (carError) throw carError;

      // Create owner member with admin privileges
      const { error: memberError } = await supabase.from("members").insert({
        car_id: car.id,
        user_id: userId,
        role: "owner",
        is_admin: true,
        joined_at: new Date().toISOString(),
      });

      if (memberError) throw memberError;

      toast.success("Car created successfully!");

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create car"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleCreateCar}>
      <FieldGroup>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>Car Details</FieldLegend>
          <FieldDescription>Basic information about your car</FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Car Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="My Honda Civic"
                value={carForm.name}
                onChange={(e) =>
                  setCarForm({ ...carForm, name: e.target.value })
                }
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="currency">Currency</FieldLabel>
              <Input
                id="currency"
                type="text"
                placeholder="CAD"
                value={carForm.currency}
                onChange={(e) =>
                  setCarForm({ ...carForm, currency: e.target.value })
                }
                required
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>Fuel Settings</FieldLegend>
          <FieldDescription>
            Used for automatic cost calculations. You can update these anytime.
          </FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="efficiency">
                Fuel Efficiency (km/L)
              </FieldLabel>
              <FieldDescription>
                Average kilometers per litre for your car
              </FieldDescription>
              <Input
                id="efficiency"
                type="number"
                step="0.1"
                min="0.1"
                placeholder="12.5"
                value={carForm.kmPerLitre}
                onChange={(e) =>
                  setCarForm({ ...carForm, kmPerLitre: e.target.value })
                }
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="price">
                Default Fuel Price (per L)
              </FieldLabel>
              <FieldDescription>
                Typical fuel price in your area
              </FieldDescription>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1.40"
                value={carForm.defaultPricePerLitre}
                onChange={(e) =>
                  setCarForm({
                    ...carForm,
                    defaultPricePerLitre: e.target.value,
                  })
                }
                required
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <Field>
          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              !carForm.name.trim() ||
              !carForm.currency.trim() ||
              !carForm.kmPerLitre ||
              !carForm.defaultPricePerLitre
            }
          >
            {loading ? "Creating..." : "Create Car"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
