"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExpenseFromFunction } from "@/lib/types";

// Use Pick to create expense columns type (fuel expenses are just expenses filtered by type)
export type ExpenseTableRow = Pick<
  ExpenseFromFunction,
  "id" | "car_id" | "payer_id" | "amount" | "date" | "created_at" | "payer_name"
>;

export function createExpenseColumns(
  currency: string,
  onEdit: (expense: ExpenseTableRow) => void,
  onDelete: (expenseId: string) => void
): ColumnDef<ExpenseTableRow>[] {
  return [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
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
      accessorKey: "payer_name",
      header: "Paid By",
      cell: ({ row }) => {
        return <span>{row.getValue("payer_name")}</span>;
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
        const expense = row.original;

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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(expense.id)}
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
