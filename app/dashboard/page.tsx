"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkUserProfile() {
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("name")
        .eq("id", user.id)
        .single();

      if (!data?.name) {
        router.push("/onboarding");
      } else {
        setUserName(data.name);
      }
      setLoading(false);
    }

    checkUserProfile();
  }, [user, router, supabase]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {userName}!</CardTitle>
            <CardDescription>
              You're successfully authenticated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Phone: {user?.phone}
            </p>
            <p className="mt-4 text-sm">
              Dashboard features coming in Phase 3 & 4...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
