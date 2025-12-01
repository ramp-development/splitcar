"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BalanceTableRow } from "@/lib/types/balance";

export function createBalanceColumns(
  currency: string
): ColumnDef<BalanceTableRow>[] {
  return [
    {
      accessorKey: "member_name",
      header: "Member",
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("member_name")}</span>;
      },
    },
    {
      accessorKey: "fuelPaid",
      header: "Fuel Paid",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("fuelPaid"));
        return (
          <span className="text-muted-foreground">
            {currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "tripUsage",
      header: "Trip Usage",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("tripUsage"));
        return (
          <span className="text-muted-foreground">
            {currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "settlementsReceived",
      header: "Received",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("settlementsReceived"));
        return (
          <span className="text-muted-foreground">
            {currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "settlementsSent",
      header: "Sent",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("settlementsSent"));
        return (
          <span className="text-muted-foreground">
            {currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "netBalance",
      header: "Balance",
      cell: ({ row }) => {
        const balance = parseFloat(row.getValue("netBalance"));
        const isPositive = balance > 0;
        const isZero = Math.abs(balance) < 0.01;

        return (
          <span
            className={`font-semibold ${
              isZero
                ? "text-muted-foreground"
                : isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {currency} {balance.toFixed(2)}
          </span>
        );
      },
    },
  ];
}
