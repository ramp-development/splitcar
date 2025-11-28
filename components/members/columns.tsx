"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Member = {
  id: string;
  name: string;
  phone: string | null;
  is_guest: boolean;
  user_id: string | null;
  archived: boolean;
};

export function createMemberColumns(
  currentUserId: string | undefined,
  onEdit: (member: Member) => void,
  onToggleGuest: (memberId: string, isGuest: boolean) => void,
  onArchive: (memberId: string, archived: boolean) => void,
  onInvite: (member: Member) => void
): ColumnDef<Member>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const isCurrentUser = row.original.user_id === currentUserId;
        const isArchived = row.original.archived;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.getValue("name")}</span>
            {isCurrentUser && <Badge variant="secondary">You</Badge>}
            {isArchived && <Badge variant="outline">Archived</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string | null;
        return (
          <span className="text-muted-foreground">
            {phone || "No phone number"}
          </span>
        );
      },
    },
    {
      accessorKey: "is_guest",
      header: "Type",
      cell: ({ row }) => {
        const isGuest = row.getValue("is_guest") as boolean;

        return isGuest ? (
          <Badge variant="outline">Guest</Badge>
        ) : (
          <Badge variant="secondary">Owner</Badge>
        );
      },
    },
    {
      accessorKey: "user_id",
      header: "Status",
      cell: ({ row }) => {
        const hasAccount = !!row.original.user_id;
        const hasPhone = !!row.original.phone;

        if (hasAccount) {
          return <Badge variant="default">Joined</Badge>;
        }

        if (hasPhone) {
          return <Badge variant="secondary">Pending</Badge>;
        }

        return <Badge variant="outline">No phone</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original;
        const isCurrentUser = member.user_id === currentUserId;
        const canInvite = member.phone && !member.user_id;

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
              {canInvite && (
                <DropdownMenuItem onClick={() => onInvite(member)}>
                  Send Invite
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit(member)}>
                Edit
              </DropdownMenuItem>
              {!isCurrentUser && (
                <>
                  <DropdownMenuItem
                    onClick={() => onToggleGuest(member.id, !member.is_guest)}
                  >
                    {member.is_guest ? "Make Member" : "Make Guest"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onArchive(member.id, !member.archived)}
                    className="text-destructive"
                  >
                    {member.archived ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
