"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export default function VerifyPage() {
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const savedPhone = sessionStorage.getItem("phone");
    if (!savedPhone) {
      toast.error("Phone number not found. Please start from login.");
      router.push("/login");
    } else {
      setPhone(savedPhone);
    }
  }, [router]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      });

      if (error) throw error;

      // Link any members with this phone number to the user
      await supabase
        .from("members")
        .update({ user_id: data.user?.id })
        .eq("phone", phone)
        .is("user_id", null);

      // Check if user has a name set
      const { data: userData } = await supabase
        .from("users")
        .select("name")
        .eq("id", data.user?.id)
        .single();

      sessionStorage.removeItem("phone");
      toast.success("Successfully logged in!");

      // Redirect to onboarding if name is not set, otherwise dashboard
      if (!userData?.name) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) throw error;
      toast.success("OTP resent!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify Your Phone</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to {phone}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp" className="sr-only">
              One-Time Password
            </Label>
            <InputOTP
              id="otp"
              maxLength={6}
              value={otp}
              onChange={setOtp}
              autoFocus
              pattern={REGEXP_ONLY_DIGITS}
              containerClassName="justify-between w-full"
            >
              <InputOTPGroup className="flex-1">
                <InputOTPSlot index={0} className="flex-1" />
                <InputOTPSlot index={1} className="flex-1" />
                <InputOTPSlot index={2} className="flex-1" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup className="flex-1">
                <InputOTPSlot index={3} className="flex-1" />
                <InputOTPSlot index={4} className="flex-1" />
                <InputOTPSlot index={5} className="flex-1" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {process.env.NODE_ENV === "development" && (
            <p className="text-center text-sm text-muted-foreground">
              For testing, use OTP: 123456
            </p>
          )}
          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendOTP}
              disabled={loading}
            >
              Resend OTP
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
