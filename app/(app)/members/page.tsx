"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { createMemberColumns, Member } from "@/components/members/columns";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [carId, setCarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: "",
    phone: "",
    isGuest: false,
  });
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadMembers() {
      if (!user) return;

      const supabase = createClient();

      try {
        // Get user's car
        const { data: carData } = await supabase
          .from("cars")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!carData) {
          router.push("/dashboard");
          return;
        }

        setCarId(carData.id);

        // Get members
        const { data: membersData, error } = await supabase
          .from("members")
          .select("*")
          .eq("car_id", carData.id);

        if (error) throw error;

        // Sort members: current user first, then members, then guests
        const sortedMembers = (membersData || []).sort((a, b) => {
          if (a.user_id === user.id) return -1;
          if (b.user_id === user.id) return 1;

          // Then members before guests
          if (!a.is_guest && b.is_guest) return -1;
          if (a.is_guest && !b.is_guest) return 1;

          // Within same group, sort alphabetically
          return a.name.localeCompare(b.name);
        });

        setMembers(sortedMembers);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [user, router]);

  async function handleSubmitMember(e: React.FormEvent) {
    e.preventDefault();
    if (!carId) return;

    const supabase = createClient();

    try {
      if (editingMember) {
        // Update existing member
        const { error } = await supabase
          .from("members")
          .update({
            name: memberForm.name,
            phone: memberForm.phone || null,
            is_guest: memberForm.isGuest,
          })
          .eq("id", editingMember.id);

        if (error) throw error;

        toast.success("Member updated!");
        setMembers(
          members.map((m) =>
            m.id === editingMember.id
              ? {
                  ...m,
                  name: memberForm.name,
                  phone: memberForm.phone || null,
                  is_guest: memberForm.isGuest,
                }
              : m
          )
        );
      } else {
        // Add new member
        const { error } = await supabase.from("members").insert({
          car_id: carId,
          name: memberForm.name,
          phone: memberForm.phone || null,
          is_guest: memberForm.isGuest,
        });

        if (error) throw error;

        toast.success("Member added!");

        // Reload members
        if (!user) return;

        const { data: membersData } = await supabase
          .from("members")
          .select("*")
          .eq("car_id", carId);

        const sortedMembers = (membersData || []).sort((a, b) => {
          if (a.user_id === user.id) return -1;
          if (b.user_id === user.id) return 1;

          // Then members before guests
          if (!a.is_guest && b.is_guest) return -1;
          if (a.is_guest && !b.is_guest) return 1;

          // Within same group, sort alphabetically
          return a.name.localeCompare(b.name);
        });

        setMembers(sortedMembers);
      }

      setDialogOpen(false);
      setEditingMember(null);
      setMemberForm({ name: "", phone: "", isGuest: false });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : editingMember
            ? "Failed to update member"
            : "Failed to add member"
      );
    }
  }

  function handleEditMember(member: Member) {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      phone: member.phone || "",
      isGuest: member.is_guest,
    });
    setDialogOpen(true);
  }

  async function handleArchiveMember(memberId: string, archived: boolean) {
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("members")
        .update({ archived })
        .eq("id", memberId);

      if (error) throw error;

      toast.success(archived ? "Member archived" : "Member unarchived");
      setMembers(
        members.map((m) => (m.id === memberId ? { ...m, archived } : m))
      );
    } catch (error) {
      toast.error("Failed to update member");
      console.error(error);
    }
  }

  async function handleToggleGuest(memberId: string, isGuest: boolean) {
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("members")
        .update({ is_guest: isGuest })
        .eq("id", memberId);

      if (error) throw error;

      toast.success(isGuest ? "Changed to guest" : "Changed to member");
      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, is_guest: isGuest } : m
        )
      );
    } catch (error) {
      toast.error("Failed to update member");
      console.error(error);
    }
  }

  const columns = createMemberColumns(
    user?.id,
    handleEditMember,
    handleToggleGuest,
    handleArchiveMember
  );

  const filteredMembers = showArchived
    ? members
    : members.filter((m) => !m.archived);

  const hasArchivedMembers = members.some((m) => m.archived);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={filteredMembers}
      filterColumn="name"
      filterPlaceholder="Filter by name..."
      toolbarActions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          {hasArchivedMembers && (
            <div className="flex items-center gap-2 text-sm">
              <Switch
                id="show-archived"
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <Label htmlFor="show-archived" className="cursor-pointer text-sm">
                Archived
              </Label>
            </div>
          )}
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingMember(null);
                setMemberForm({ name: "", phone: "", isGuest: false });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? "Edit Member" : "Add New Member"}
                </DialogTitle>
                <DialogDescription>
                  {editingMember
                    ? "Update member information"
                    : "Add someone who shares this car"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitMember} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="member-name">Name</Label>
                  <Input
                    id="member-name"
                    value={memberForm.name}
                    onChange={(e) =>
                      setMemberForm({ ...memberForm, name: e.target.value })
                    }
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-phone">Phone (optional)</Label>
                  <Input
                    id="member-phone"
                    type="tel"
                    value={memberForm.phone}
                    onChange={(e) =>
                      setMemberForm({
                        ...memberForm,
                        phone: e.target.value,
                      })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-guest">Guest member</Label>
                  <Switch
                    id="is-guest"
                    checked={memberForm.isGuest}
                    onCheckedChange={(checked) =>
                      setMemberForm({ ...memberForm, isGuest: checked })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingMember ? "Update Member" : "Add Member"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      }
    />
  );
}
