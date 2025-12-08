import React from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Car, Receipt, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ReactNode } from "react";

export default function HeroSection() {
  return (
    <main className="overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block"
      >
        <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
        <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
      </div>
      <section className="py-8">
        <div className="relative pt-24 md:pt-36 space-y-16">
          <div className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-56 -z-20 lg:top-32">
            <div className="size-full bg-linear-to-b from-primary/5 via-primary/10 to-background" />
          </div>

          <div
            aria-hidden
            className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"
          />

          <div className="mx-auto max-w-7xl px-4">
            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
              <Link
                href="#features"
                className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
              >
                <span className="text-foreground text-sm">
                  Fair cost splitting for shared car trips
                </span>
                <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                  <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-3" />
                    </span>
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-3" />
                    </span>
                  </div>
                </div>
              </Link>

              <h1 className="mx-auto mt-8 max-w-4xl text-balance text-5xl max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem]">
                Track fuel fills, split costs fairly
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                SplitCar makes it easy to track fuel fills, log trips, and
                automatically calculate fair cost splits for group travel.
              </p>

              <div className="mt-12">
                <SignedIn>
                  <Button size="lg" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </SignedIn>
                <SignedOut>
                  <div className="flex flex-col items-center justify-center gap-2 md:flex-row">
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
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4">
            <Card className="p-0 grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-4 w-full overflow-hidden shadow-primary/5 *:text-center">
              <div className="group shadow-primary lg:col-span-1 py-6 border-b md:border-r lg:border-b-0">
                <CardHeader className="pb-3">
                  <CardDecorator>
                    <Car className="size-6" aria-hidden />
                  </CardDecorator>

                  <h3 className="mt-6 font-medium">Track Your Car</h3>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-balance max-w-[32ch] mx-auto">
                    Add your car details and fuel efficiency for accurate cost
                    calculations.
                  </p>
                </CardContent>
              </div>

              <div className="group shadow-primary lg:col-span-1 py-6 border-b lg:border-b-0 lg:border-r">
                <CardHeader className="pb-3">
                  <CardDecorator>
                    <Users className="size-6" aria-hidden />
                  </CardDecorator>

                  <h3 className="mt-6 font-medium">Manage Members</h3>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-balance max-w-[32ch] mx-auto">
                    Add friends, family, or guests who share the car on your
                    trips.
                  </p>
                </CardContent>
              </div>

              <div className="group shadow-primary lg:col-span-1 py-6 border-b md:border-b-0 md:border-r lg:border-b-0">
                <CardHeader className="pb-3">
                  <CardDecorator>
                    <Receipt className="size-6" aria-hidden />
                  </CardDecorator>

                  <h3 className="mt-6 font-medium">Log Expenses</h3>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-balance max-w-[32ch] mx-auto">
                    Track expenses and trips with detailed distance and cost
                    tracking.
                  </p>
                </CardContent>
              </div>

              <div className="group shadow-primary lg:col-span-1 py-6">
                <CardHeader className="pb-3">
                  <CardDecorator>
                    <Calculator className="size-6" aria-hidden />
                  </CardDecorator>

                  <h3 className="mt-6 font-medium">Fair Splits</h3>
                </CardHeader>

                <CardContent>
                  <p className="text-sm text-balance max-w-[32ch] mx-auto">
                    Automatically calculate who owes what based on actual usage.
                  </p>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[24px_24px] dark:opacity-50"
    />

    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
      {children}
    </div>
  </div>
);
