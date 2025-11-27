"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CarSetupForm } from "@/components/car/car-setup-form";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCar, setHasCar] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkUserProfile() {
      if (!user) return;

      const supabase = createClient();

      // Check user profile
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();

      if (!userData?.name) {
        router.push("/onboarding");
        return;
      }

      // Check if user has a car
      const { data: carData } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      setUserName(userData.name);
      setHasCar(!!carData);
      setLoading(false);
    }

    checkUserProfile();
  }, [user, router]);

  const handleCarCreated = () => {
    setHasCar(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Dialog open={!hasCar} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Up Your Car</DialogTitle>
            <DialogDescription>
              Add your car details to start tracking expenses
            </DialogDescription>
          </DialogHeader>
          {user && (
            <CarSetupForm userId={user.id} onSuccess={handleCarCreated} />
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">Your SplitDrive overview</p>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => router.push("/members")}
            >
              <span className="text-2xl">👥</span>
              <span>Members</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => router.push("/fuel")}
            >
              <span className="text-2xl">⛽</span>
              <span>Fuel Fills</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => router.push("/trips")}
            >
              <span className="text-2xl">🚗</span>
              <span>Trips</span>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => router.push("/balances")}
            >
              <span className="text-2xl">💰</span>
              <span>Balances</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex-col gap-2"
              onClick={() => router.push("/settlements")}
            >
              <span className="text-2xl">🤝</span>
              <span>Settlements</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
