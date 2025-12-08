"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUserCarId } from "@/lib/queries/cars";
import { useAuth } from "@/lib/auth/context";
import { sortMembersByPriority } from "@/lib/services/member-sorter";
import { getFirstName } from "@/lib/types/member";
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
import { createMemberColumns } from "@/components/members/columns";
import { MemberWithUser } from "@/lib/queries/members";

export default function MembersPage() {
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [carId, setCarId] = useState<string | null>(null);
  const [carName, setCarName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithUser | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: "",
    
    isGuest: false,
  });
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadMembers() {
      if (!user) return;

      const supabase = createClient();

      try {
        // Get user's car (either owned or member)
        const carIdResult = await getUserCarId(supabase, user.id);

        if (!carIdResult) {
          router.push("/dashboard");
          return;
        }

        // Get car details
        const { data: carData } = await supabase
          .from("cars")
          .select("name")
          .eq("id", carIdResult)
          .single();

        setCarId(carIdResult);
        setCarName(carData?.name || "");

        // Get members using function to bypass RLS infinite recursion
        const { data: membersData, error } = await supabase.rpc(
          "get_car_members",
          { p_user_id: user.id }
        );

        if (error) throw error;

        // Sort members using helper function
        const sortedMembers = sortMembersByPriority(membersData || [], user.id);

        setMembers(sortedMembers);
      } catch (error) {
        toast.error("Failed to load members");
        console.error(error);
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
            
            role: memberForm.isGuest ? "guest" : "owner",
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
                  
                  role: memberForm.isGuest ? "guest" : "owner",
                }
              : m
          )
        );
      } else {
        // Add new member
        const { error } = await supabase.from("members").insert({
          car_id: carId,
          name: memberForm.name,
          
          role: memberForm.isGuest ? "guest" : "owner",
        });

        if (error) throw error;

        toast.success("Member added!");

        // Reload members
        if (!user) return;

        const { data: membersData } = await supabase.rpc(
          "get_car_members",
          { p_user_id: user.id }
        );

        // Sort members using helper function
        const sortedMembers = sortMembersByPriority(membersData || [], user.id);

        setMembers(sortedMembers);
      }

      setDialogOpen(false);
      setEditingMember(null);
      setMemberForm({ name: "",  isGuest: false });
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

  function handleEditMember(member: MemberWithUser) {
    setEditingMember(member);
    setMemberForm({
      name: member.name || "",

      isGuest: member.role === "guest",
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
        .update({ role: isGuest ? "guest" : "owner" })
        .eq("id", memberId);

      if (error) throw error;

      toast.success(isGuest ? "Changed to guest" : "Changed to owner");
      setMembers(
        members.map((m) =>
          m.id === memberId ? { ...m, role: isGuest ? "guest" : "owner" } : m
        )
      );
    } catch (error) {
      toast.error("Failed to update member");
      console.error(error);
    }
  }

  async function handleInviteMember(member: MemberWithUser) {
    // Create invite URL with invite code
    const inviteUrl = `${window.location.origin}/login?invite=${member.invite_code}`;
    const inviteMessage = `Hi ${getFirstName(member.name)}! You've been added to our SplitCar group. Click here to join: ${inviteUrl}`;

    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join the ${carName} group in SplitCar`,
          text: inviteMessage,
        });
        toast.success("Invite shared!");
      } catch (error) {
        // User cancelled the share or it failed
        if ((error as Error).name !== "AbortError") {
          // Fallback to clipboard
          fallbackToCopy(inviteMessage);
        }
      }
    } else {
      // Fallback for desktop browsers
      fallbackToCopy(inviteMessage);
    }
  }

  function fallbackToCopy(message: string) {
    navigator.clipboard.writeText(message);
    toast.success("Invite link copied!", {
      description: "Paste and send via your preferred messaging app",
    });
  }

  const columns = createMemberColumns(
    user?.id,
    handleEditMember,
    handleToggleGuest,
    handleArchiveMember,
    handleInviteMember
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
                setMemberForm({ name: "",  isGuest: false });
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
