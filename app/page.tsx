import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Car, Users, Receipt, Calculator } from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">SplitCar</h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Fair car cost tracking for group trips. Track fuel fills, log trips,
            and split costs automatically.
          </p>
          <SignedOut>
            <div className="mt-8 flex justify-center gap-4">
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <Button size="lg">Get Started</Button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg">Dashboard</Button>
              </Link>
              <SignOutButton>
                <Button size="lg" variant="outline">
                  Sign Out
                </Button>
              </SignOutButton>
            </div>
          </SignedIn>
        </div>

        {/* Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <Car className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Track Your Car</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Add your car details and fuel efficiency for accurate cost
                calculations
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Manage Members</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Add friends, family, or guests who share the car on your trips
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Receipt className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Log Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track fuel fills and trips with detailed distance and cost
                tracking
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calculator className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>Fair Splits</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically calculate who owes what based on actual usage
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-16">
          <h2 className="mb-8 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-primary">1</div>
              <h3 className="mb-2 text-xl font-semibold">Add Your Car</h3>
              <p className="text-muted-foreground">
                Set up your car with fuel efficiency and average fuel price
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-primary">2</div>
              <h3 className="mb-2 text-xl font-semibold">Track Expenses</h3>
              <p className="text-muted-foreground">
                Log fuel fills and trips as you go on your journey
              </p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-primary">3</div>
              <h3 className="mb-2 text-xl font-semibold">Split Costs</h3>
              <p className="text-muted-foreground">
                See who owes what and settle up at the end of the trip
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="mx-auto max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to get started?</CardTitle>
              <CardDescription>
                Create your free account and start tracking car costs fairly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                <Button size="lg">Start Tracking Now</Button>
              </SignUpButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
