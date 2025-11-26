"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";

type Member = {
  id: string;
  name: string;
  phone: string | null;
  is_guest: boolean;
  user_id: string | null;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [carId, setCarId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    isGuest: false,
  });
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadMembers();
  }, [user]);

  async function loadMembers() {
    if (!user) return;

    try {
      // Get user's car
      const { data: carData } = await supabase
        .from("cars")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!carData) {
        router.push("/car/setup");
        return;
      }

      setCarId(carData.id);

      // Get members
      const { data: membersData, error } = await supabase
        .from("members")
        .select("*")
        .eq("car_id", carData.id);

      if (error) throw error;

      // Sort members: current user first, then by creation date
      const sortedMembers = (membersData || []).sort((a, b) => {
        if (a.user_id === user.id) return -1;
        if (b.user_id === user.id) return 1;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      setMembers(sortedMembers);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!carId) return;

    try {
      const { error } = await supabase.from("members").insert({
        car_id: carId,
        name: newMember.name,
        phone: newMember.phone || null,
        is_guest: newMember.isGuest,
      });

      if (error) throw error;

      toast.success("Member added!");
      setDialogOpen(false);
      setNewMember({ name: "", phone: "", isGuest: false });
      loadMembers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add member"
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Members</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Car Members</CardTitle>
                <CardDescription>
                  People who share this car and split costs
                </CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Member</DialogTitle>
                    <DialogDescription>
                      Add someone who shares this car
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="member-name">Name</Label>
                      <Input
                        id="member-name"
                        value={newMember.name}
                        onChange={(e) =>
                          setNewMember({ ...newMember, name: e.target.value })
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
                        value={newMember.phone}
                        onChange={(e) =>
                          setNewMember({ ...newMember, phone: e.target.value })
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is-guest">Guest member</Label>
                      <Switch
                        id="is-guest"
                        checked={newMember.isGuest}
                        onCheckedChange={(checked) =>
                          setNewMember({ ...newMember, isGuest: checked })
                        }
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Member
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No members yet. Add your first member to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                      </div>
                      {member.phone && (
                        <p className="text-sm text-muted-foreground">
                          {member.phone}
                        </p>
                      )}
                    </div>
                    {member.user_id === user?.id && (
                      <Badge variant="secondary">You</Badge>
                    )}
                    {member.is_guest && <Badge variant="outline">Guest</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
