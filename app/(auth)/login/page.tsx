"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

function LoginForm() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    // Prefill phone from URL param if present
    const phoneParam = searchParams.get("phone");
    if (phoneParam) {
      setPhone(phoneParam);
    }
  }, [searchParams]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) throw error;

      // Store phone for verification page
      sessionStorage.setItem("phone", phone);
      toast.success("OTP sent to your phone!");
      router.push("/verify");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome to SplitCar</CardTitle>
        <CardDescription>
          Enter your phone number to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <PhoneInput
              id="phone"
              placeholder="Enter phone number"
              value={phone}
              onChange={setPhone}
              required
            />
            {process.env.NODE_ENV === "development" && (
              <p className="text-sm text-muted-foreground">
                For testing, use any number like +1 (555) XXX-XXXX
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to SplitCar</CardTitle>
          <CardDescription>
            Enter your phone number to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="h-10 bg-muted animate-pulse rounded-md" />
          </div>
        </CardContent>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}
