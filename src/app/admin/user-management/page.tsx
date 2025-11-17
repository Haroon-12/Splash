"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Trash2, 
  Shield, 
  Mail, 
  Calendar,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  isApproved: boolean;
  isSuspended: boolean;
  createdAt: string;
  lastLogin?: string;
  csvRecordId?: string;
  profileCompleteness?: number;
}

export default function UserManagementPage() {
  const { data: session, isPending } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("Failed to fetch users");
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Suspend/Unsuspend user
  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ suspended: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`User ${!currentStatus ? 'suspended' : 'unsuspended'} successfully`);
        await fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user permanently
  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to permanently delete this user? This action cannot be undone and the user will not be able to login.")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success("User deleted successfully");
        await fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  // Approve/Disapprove user
  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ approved: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`User ${!currentStatus ? 'approved' : 'disapproved'} successfully`);
        await fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update user approval");
      }
    } catch (error) {
      console.error("Error updating user approval:", error);
      toast.error("Failed to update user approval");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Show loading state
  if (isPending || loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  // Check if user is admin
  if (!session?.user || (session.user as any).userType !== "admin") {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
              <CardTitle className="text-red-500">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Only admins can access user management.</p>
            </CardContent>
          </Card>
        </div>
      </PlatformLayout>
    );
  }

  // Filter users based on search and filters
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

  const getStatusBadge = (user: User) => {
    if (user.isSuspended) {
      return <Badge variant="destructive" className="flex items-center gap-1"><Ban className="w-3 h-3" />Suspended</Badge>;
    } else if (user.isApproved) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-500"><CheckCircle className="w-3 h-3" />Approved</Badge>;
    } else {
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const colors = {
      admin: "bg-purple-500",
      influencer: "bg-blue-500",
      brand: "bg-green-500"
    };
    
    return (
      <Badge className={`${colors[userType as keyof typeof colors] || 'bg-gray-500'} text-white`}>
        {userType?.charAt(0).toUpperCase() + userType?.slice(1) || 'Unknown'}
      </Badge>
    );
  };

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">User Management</h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              Manage all user accounts, view details, and control access
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{users.length}</span>
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
                  <span className="text-2xl font-bold">{users.filter(u => u.isApproved).length}</span>
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
                  <span className="text-2xl font-bold">{users.filter(u => !u.isApproved).length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Ban className="w-4 h-4 text-red-500" />
                  <span className="text-2xl font-bold">{users.filter(u => u.isSuspended).length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search users by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="influencer">Influencer</SelectItem>
                    <SelectItem value="brand">Brand</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterType !== "all" || filterStatus !== "all" 
                      ? "No users match your current filters." 
                      : "No users have been registered yet."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{user.name}</h3>
                              {getUserTypeBadge(user.userType)}
                              {getStatusBadge(user)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                              {user.profileCompleteness !== undefined && (
                                <div className="flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" />
                                  Profile: {user.profileCompleteness}%
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                                <DialogDescription>
                                  Complete information for {user.name}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
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
                                    <div className="mt-1">{getUserTypeBadge(user.userType)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <div className="mt-1">{getStatusBadge(user)}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Created</label>
                                    <p className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Last Login</label>
                                    <p className="text-sm text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
                                  </div>
                                </div>
                                
                                {user.csvRecordId && (
                                  <div>
                                    <label className="text-sm font-medium">CSV Record ID</label>
                                    <p className="text-sm text-muted-foreground">{user.csvRecordId}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" disabled={actionLoading}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => toggleApproval(user.id, user.isApproved)}
                                disabled={actionLoading}
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                {user.isApproved ? 'Disapprove' : 'Approve'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toggleSuspension(user.id, user.isSuspended)}
                                disabled={actionLoading}
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteUser(user.id)}
                                disabled={actionLoading}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
