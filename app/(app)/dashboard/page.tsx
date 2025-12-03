"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { getUserCar } from "@/lib/queries/cars";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  CarIcon,
  HandshakeIcon,
  ReceiptIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { CarOnboardingForm } from "@/components/car/car-onboarding-form";

export default function DashboardPage() {
  const { user: authUser } = useAuth();
  const { user: clerkUser } = useUser();
  const [carName, setCarName] = useState<string | null>(null);
  const [hasCar, setHasCar] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUserCar() {
      if (!authUser || !clerkUser) return;

      const supabase = createClient();

      // Ensure user exists in database with name from Clerk
      const fullName =
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

      await supabase.from("users").upsert(
        {
          id: authUser.id,
          name: fullName || "User",
        },
        {
          onConflict: "id",
        }
      );

      // Get car details using function (bypasses RLS)
      const carData = await getUserCar(supabase, authUser.id);

      setCarName(carData?.name || null);
      setHasCar(!!carData);
      setLoading(false);
    }

    checkUserCar();
  }, [authUser, clerkUser]);

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
      label: "Expenses",
      href: "/expenses",
      icon: <ReceiptIcon className="w-4 h-4" />,
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

  const handleCarCreated = () => {
    setHasCar(true);
    router.refresh();
  };

  return (
    <>
      {/* Car Setup Modal */}
      <Dialog open={!hasCar && !loading} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to SplitCar!</DialogTitle>
            <DialogDescription>
              Let&apos;s set up your car to start tracking costs
            </DialogDescription>
          </DialogHeader>
          {authUser && (
            <CarOnboardingForm
              userId={authUser.id}
              onSuccess={handleCarCreated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dashboard Content */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">
            Welcome back{clerkUser?.firstName ? `, ${clerkUser.firstName}` : ""}
            !
          </h1>
          <p className="text-muted-foreground">Your SplitCar overview</p>
          {carName && (
            <p className="text-sm text-muted-foreground mt-2">
              Car:{" "}
              <span className="font-medium text-foreground">{carName}</span>
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
