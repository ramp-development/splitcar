"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { UserButton, useUser } from "@clerk/nextjs";

export function AppNavbar() {
  const pathname = usePathname();
  const { user } = useUser();

  const navigationItems = [
    {
      label: "Members",
      href: "/members",
    },
    {
      label: "Expenses",
      href: "/expenses",
    },
    {
      label: "Trips",
      href: "/trips",
    },
    {
      label: "Balances",
      href: "/balances",
    },
    {
      label: "Settlements",
      href: "/settlements",
    },
  ];

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 md:px-6 mx-auto max-w-6xl">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">SplitCar</span>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    asChild
                    active={pathname === item.href}
                    className={navigationMenuTriggerStyle()}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {user && (
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {user.firstName}
            </span>
          )}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>
    </header>
  );
}
