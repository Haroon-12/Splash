"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, XCircle, Clock, Shield, Home } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  userType: "brand" | "influencer" | "admin";
  isApproved: boolean;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    brands: 0,
    influencers: 0,
    admins: 0
  });

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user?.userType !== "admin") {
      toast.error("Access denied. Admin only.");
      router.push("/dashboard/browse-influencers");
    }
  }, [session, router]);

  useEffect(() => {
    if (session?.user?.userType === "admin") {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      
      if (!response.ok) throw new Error("Failed to fetch users");
      
      const data = await response.json();
      setUsers(data.users || []);
      
      // Calculate stats
      const total = data.users.length;
      const pending = data.users.filter((u: User) => !u.isApproved).length;
      const approved = data.users.filter((u: User) => u.isApproved).length;
      const brands = data.users.filter((u: User) => u.userType === "brand").length;
      const influencers = data.users.filter((u: User) => u.userType === "influencer").length;
      const admins = data.users.filter((u: User) => u.userType === "admin").length;
      
      setStats({ total, pending, approved, brands, influencers, admins });
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isApproved: true })
      });

      if (!response.ok) throw new Error("Failed to approve user");

      toast.success("User approved successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to approve user");
      console.error(error);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (session?.user?.userType !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage users and platform settings</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button onClick={() => router.push("/admin/add-admin")}>
              <Shield className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-2xl font-bold">{stats.pending}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-2xl font-bold">{stats.approved}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Brands</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.brands}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Influencers</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{stats.influencers}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">{stats.admins}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage and approve user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant={
                      user.userType === "admin" ? "default" :
                      user.userType === "brand" ? "secondary" :
                      "outline"
                    }>
                      {user.userType}
                    </Badge>

                    {user.isApproved ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}

                    {!user.isApproved && user.userType !== "admin" && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}