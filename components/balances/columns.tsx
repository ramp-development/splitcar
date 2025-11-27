"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Balance = {
  member_id: string;
  member_name: string;
  fuel_paid: number;
  trip_usage: number;
  settlements_received: number;
  settlements_sent: number;
  net_balance: number;
};

export function createBalanceColumns(
  currency: string
): ColumnDef<Balance>[] {
  return [
    {
      accessorKey: "member_name",
      header: "Member",
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("member_name")}</span>;
      },
    },
    {
      accessorKey: "fuel_paid",
      header: "Fuel Paid",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("fuel_paid"));
        return (
          <span className="text-muted-foreground">
            {currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "trip_usage",
      header: "Trip Usage",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("trip_usage"));
        return (
          <span className="text-muted-foreground">
            {currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "settlements_received",
      header: "Received",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("settlements_received"));
        return (
          <span className="text-muted-foreground">
            {currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "settlements_sent",
      header: "Sent",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("settlements_sent"));
        return (
          <span className="text-muted-foreground">
            {currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "net_balance",
      header: "Balance",
      cell: ({ row }) => {
        const balance = parseFloat(row.getValue("net_balance"));
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
