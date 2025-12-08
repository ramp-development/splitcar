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
import { Badge } from "@/components/ui/badge";
import { Trip } from "@/lib/types";

// Trip table row extends Trip with calculated display fields
export type TripTableRow = Pick<
  Trip,
  "id" | "car_id" | "name" | "distance" | "passengers" | "date" | "created_at"
> & {
  passenger_names: string[];
  cost_per_passenger: number;
  total_cost: number;
};

export function createTripColumns(
  currency: string,
  distanceUnit: string,
  onEdit: (trip: TripTableRow) => void,
  onDelete: (tripId: string) => void
): ColumnDef<TripTableRow>[] {
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
      accessorKey: "name",
      header: "Trip",
      cell: ({ row }) => {
        const name = row.getValue("name") as string | null;
        return <span className="font-medium">{name || "—"}</span>;
      },
    },
    {
      accessorKey: "distance",
      header: "Distance",
      cell: ({ row }) => {
        const distance = parseFloat(row.getValue("distance"));
        return (
          <span>
            {distance.toFixed(1)} {distanceUnit}
          </span>
        );
      },
    },
    {
      accessorKey: "passenger_names",
      header: "Passengers",
      cell: ({ row }) => {
        const passengers = row.getValue("passenger_names") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {passengers.map((name, idx) => (
              <Badge key={idx} variant="secondary">
                {name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "total_cost",
      header: "Total Cost",
      cell: ({ row }) => {
        const totalCost = parseFloat(row.getValue("total_cost"));
        return (
          <span className="font-medium">
            {currency} {totalCost.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "cost_per_passenger",
      header: "Per Person",
      cell: ({ row }) => {
        const costPerPassenger = row.original.cost_per_passenger;
        return (
          <span className="text-muted-foreground">
            {currency} {costPerPassenger.toFixed(2)}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const trip = row.original;

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
              <DropdownMenuItem onClick={() => onEdit(trip)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(trip.id)}
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
