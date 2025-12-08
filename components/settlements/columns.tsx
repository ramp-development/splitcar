"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettlementWithNames } from "@/lib/queries/settlements";

// Use Pick to select only the fields needed for display
export type SettlementTableRow = Pick<
  SettlementWithNames,
  "id" | "car_id" | "from_id" | "to_id" | "amount" | "created_at" | "from_name" | "to_name"
>;

export function createSettlementColumns(
  currency: string,
  onDelete: (settlementId: string) => void
): ColumnDef<SettlementTableRow>[] {
  return [
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <span className="font-medium">
            {date.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "from_name",
      header: "From",
      cell: ({ row }) => {
        return <span>{row.getValue("from_name")}</span>;
      },
    },
    {
      accessorKey: "to_name",
      header: "To",
      cell: ({ row }) => {
        return <span>{row.getValue("to_name")}</span>;
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        return (
          <span className="font-medium">
            {currency} {amount.toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const settlement = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onDelete(settlement.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
