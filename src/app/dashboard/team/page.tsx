"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Users, UserPlus, X } from "lucide-react";
import { UpgradeRequired } from "@/components/platform/upgrade-required";

export default function TeamPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  
  const [inviteEmail, setInviteEmail] = useState("");

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
        setMembers(data.members || []);
        setSubscription(data.subscription);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to load team data");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.push("/login");
        return;
      }
      if ((session.user as any).userType !== "brand") {
        toast.error("Only brands can access team settings");
        router.push("/dashboard");
        return;
      }
      fetchTeamData();
    }
  }, [session, isPending, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    // Check if they are on a team plan
    if (subscription?.planType !== "team" && subscription?.planType !== "premium") {
      toast.error("You need a Team plan to add members");
      router.push("/billing");
      return;
    }

    try {
      setInviting(true);
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Member added successfully!");
        setInviteEmail("");
        fetchTeamData();
      } else {
        toast.error(data.error || "Failed to add member");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      setRemovingId(memberId);
      const res = await fetch(`/api/team?id=${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Member removed");
        fetchTeamData();
      } else {
        toast.error(data.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setRemovingId(null);
    }
  };

  if (isPending || loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PlatformLayout>
    );
  }

  const isTeamPlan = subscription?.planType === "team" || subscription?.planType === "premium";

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2 flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Manage your workspace members and collaboration access.
          </p>
        </div>

        {!isTeamPlan && (
          <div className="mb-6">
            <UpgradeRequired 
              description={`You are currently on the ${subscription?.planType || "Basic"} plan. To invite team members and collaborate in a shared workspace, you need to upgrade to a Team Plan.`}
              buttonText="View Team Plans"
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members ({members.length})</CardTitle>
                <CardDescription>
                  People who have access to this brand workspace.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No team members yet</p>
                    {isTeamPlan && <p className="text-sm mt-1">Invite someone using the form to get started.</p>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {member.user?.image ? (
                              <img src={member.user.image} alt={member.user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-primary">{member.user?.name?.charAt(0) || "U"}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{member.user?.name || "Unknown User"}</p>
                            <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-medium px-2 py-1 bg-secondary rounded-full capitalize">
                            {member.role}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemove(member.id)}
                            disabled={removingId === member.id || member.role === "owner"}
                          >
                            {removingId === member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invite Member</CardTitle>
                <CardDescription>
                  Add someone to your workspace. They must have registered on the platform first.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="colleague@company.com" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={!isTeamPlan || inviting}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={!isTeamPlan || inviting || !inviteEmail}
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Send Invite
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Team Plan Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Members:</span>
                  <span className="font-medium">{members.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Allowed:</span>
                  <span className="font-medium">10</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground">Cost per member:</span>
                  <span className="font-medium">$42/mo</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
