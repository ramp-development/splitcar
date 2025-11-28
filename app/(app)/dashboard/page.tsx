"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { getUserCar } from "@/lib/queries/car";
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
import {
  CarIcon,
  FuelIcon,
  HandshakeIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [carName, setCarName] = useState<string | null>(null);
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

      // Get car details using function (bypasses RLS)
      const carData = await getUserCar(supabase, user.id);

      console.log("[DASHBOARD DEBUG] User ID:", user.id);
      console.log("[DASHBOARD DEBUG] Car data:", carData);

      setUserName(userData.name);
      setCarName(carData?.name || null);
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

  const items = [
    {
      label: "Members",
      href: "/members",
      icon: <UsersIcon className="w-4 h-4" />,
    },
    {
      label: "Fuel",
      href: "/fuel",
      icon: <FuelIcon className="w-4 h-4" />,
    },
    {
      label: "Trips",
      href: "/trips",
      icon: <CarIcon className="w-4 h-4" />,
    },
    {
      label: "Balances",
      href: "/balances",
      icon: <WalletIcon className="w-4 h-4" />,
    },
    {
      label: "Settlements",
      href: "/settlements",
      icon: <HandshakeIcon className="w-4 h-4" />,
    },
  ];

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
          <h1 className="text-3xl font-bold mb-1">
            Welcome back, {userName?.split(" ")[0] || userName}!
          </h1>
          <p className="text-muted-foreground">Your SplitCar overview</p>
          {carName && (
            <p className="text-sm text-muted-foreground mt-2">
              Car: <span className="font-medium text-foreground">{carName}</span>
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((item) => (
              <Button
                key={item.href}
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => router.push(item.href)}
              >
                <span className="text-2xl text-primary">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
