"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock,
  Trash2,
  UserCheck,
  UserX,
  Home
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  isApproved: boolean;
  isSuspended: boolean;
  createdAt: string;
  lastLogin: string | null;
  csvRecordId: string | null;
  profileCompleteness: number;
}

export default function AdminUsersPage() {
  const { data: session, isPending } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "admin" | "influencer" | "brand">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending" | "suspended">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch users');
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || user.userType === filterType;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "approved" && user.isApproved) ||
                         (filterStatus === "pending" && !user.isApproved) ||
                         (filterStatus === "suspended" && user.isSuspended);
    return matchesSearch && matchesType && matchesStatus;
  });

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: !currentStatus }),
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(`User ${!currentStatus ? 'approved' : 'disapproved'}`);
        fetchUsers(); // Refresh the list
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error updating user status');
    }
  };

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suspended: !currentStatus }),
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(`User ${!currentStatus ? 'suspended' : 'unsuspended'}`);
        fetchUsers(); // Refresh the list
      } else {
        toast.error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error updating user status');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers(); // Refresh the list
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.isSuspended) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (user.isApproved) {
      return <Badge variant="default">Approved</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'admin': return 'text-red-600';
      case 'influencer': return 'text-blue-600';
      case 'brand': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Redirect if not admin - moved after all hooks
  if (!isPending && (!session?.user || (session.user as any)?.userType !== "admin")) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          <Users className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.isApproved).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter(u => !u.isApproved).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.isSuspended).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="admin">Admin</option>
                <option value="influencer">Influencer</option>
                <option value="brand">Brand</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.name}</h3>
                      <span className={`text-sm font-medium ${getUserTypeColor(user.userType)}`}>
                        {user.userType}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(user)}
                      <span className="text-xs text-muted-foreground">
                        Profile: {user.profileCompleteness}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>
                          Complete information for {user.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <p className="text-sm text-muted-foreground">{user.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">User Type</label>
                          <p className="text-sm text-muted-foreground">{user.userType}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <div className="mt-1">{getStatusBadge(user)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Profile Completeness</label>
                          <p className="text-sm text-muted-foreground">{user.profileCompleteness}%</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Created</label>
                          <p className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {user.lastLogin && (
                          <div>
                            <label className="text-sm font-medium">Last Login</label>
                            <p className="text-sm text-muted-foreground">
                              {new Date(user.lastLogin).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => toggleApproval(user.id, user.isApproved)}
                        className="flex items-center gap-2"
                      >
                        {user.isApproved ? (
                          <>
                            <UserX className="h-4 w-4" />
                            Disapprove
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Approve
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => toggleSuspension(user.id, user.isSuspended)}
                        className="flex items-center gap-2"
                      >
                        {user.isSuspended ? (
                          <>
                            <UserCheck className="h-4 w-4" />
                            Unsuspend
                          </>
                        ) : (
                          <>
                            <UserX className="h-4 w-4" />
                            Suspend
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteUser(user.id)}
                        className="flex items-center gap-2 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
