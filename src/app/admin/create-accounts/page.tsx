"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, UserPlus, AlertCircle, Trash2, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";

interface Claim {
  id: number;
  userId: string;
  csvRecordId: string;
  claimReason: string;
  status: 'pending' | 'approved' | 'rejected';
  userName: string;
  userEmail: string;
  registrationData?: string;
}

interface CreatedAccount {
  id: string;
  name: string;
  email: string;
  userType: string;
  isApproved: boolean;
  createdAt: string;
  csvRecordId?: string;
}

export default function CreateAccountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [createdAccounts, setCreatedAccounts] = useState<CreatedAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'to-create' | 'created'>('to-create');

  // Fetch approved claims
  const fetchApprovedClaims = async () => {
    try {
      const response = await fetch("/api/admin/profile-claims");
      const data = await response.json();
      const approvedClaims = data.filter((claim: Claim) => 
        claim.status === 'approved' && claim.registrationData
      );
      setClaims(approvedClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
      toast.error("Failed to load claims");
    }
  };

  // Fetch created accounts
  const fetchCreatedAccounts = async () => {
    try {
      const response = await fetch("/api/admin/created-accounts", {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error("User not authenticated");
          setCreatedAccounts([]);
          toast.error("Please log in to view created accounts");
          return;
        } else if (response.status === 403) {
          console.error("User not authorized as admin");
          setCreatedAccounts([]);
          toast.error("Admin access required to view created accounts");
          return;
        } else {
          console.error("API returned error status:", response.status);
          setCreatedAccounts([]);
          toast.error("Failed to load created accounts");
          return;
        }
      }
      
      const data = await response.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setCreatedAccounts(data);
      } else {
        console.error("Invalid data format from API:", data);
        setCreatedAccounts([]);
        toast.error("Failed to load created accounts - invalid data format");
      }
    } catch (error) {
      console.error("Error fetching created accounts:", error);
      setCreatedAccounts([]); // Ensure it's always an array
      toast.error("Failed to load created accounts");
    }
  };

  // Delete account
  const deleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to delete this account? This action cannot be undone and the user will not be able to login.")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/delete-account/${accountId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("Account deleted successfully");
        await fetchCreatedAccounts(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsLoading(false);
    }
  };

  // Create account for selected claim
  const createAccount = async (claim: Claim) => {
    if (!claim.registrationData) {
      toast.error("No registration data available for this claim");
      return;
    }

    setIsLoading(true);
    try {
      const registrationData = JSON.parse(claim.registrationData);
      
      console.log('Creating account with:', registrationData);

      const { data, error } = await authClient.signUp.email({
        email: registrationData.email,
        password: registrationData.password,
        name: registrationData.name,
      });

      if (error) {
        console.error('Error creating account:', error);
        toast.error((error as any).message || "Failed to create account");
        return;
      }

      if (data?.user?.id) {
        console.log('Account created successfully:', data.user.id);

        // Update user type
        try {
          const updateResponse = await fetch("/api/users/update-type", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data.user.id,
              userType: registrationData.userType,
            }),
          });

          if (updateResponse.ok) {
            console.log('User type updated successfully');
          } else {
            console.warn('Failed to update user type');
          }
        } catch (updateError) {
          console.warn('Error updating user type:', updateError);
        }

        toast.success(`Account created successfully for ${registrationData.name}!`);
        
        // Refresh claims and created accounts lists
        await fetchApprovedClaims();
        await fetchCreatedAccounts();
      } else {
        toast.error("Failed to create account");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  // Load claims and created accounts on component mount
  useEffect(() => {
    fetchApprovedClaims();
    fetchCreatedAccounts();
  }, []);

  // Check if user is admin - moved after all hooks
  if (!session?.user || session.user.userType !== "admin") {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
              <CardTitle className="text-red-500">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Only admins can create accounts.</p>
            </CardContent>
          </Card>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Create Accounts for Approved Claims
              </CardTitle>
              <CardDescription>
                Create accounts for users whose profile claims have been approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'to-create' | 'created')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="to-create" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    To Create ({claims.length})
                  </TabsTrigger>
                  <TabsTrigger value="created" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Created ({Array.isArray(createdAccounts) ? createdAccounts.length : 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="to-create" className="space-y-4">
                  {claims.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Approved Claims Found</h3>
                      <p className="text-muted-foreground">
                        There are no approved claims with registration data to create accounts for.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {claims.map((claim) => {
                        const registrationData = claim.registrationData ? 
                          JSON.parse(claim.registrationData) : null;
                        
                        return (
                          <Card key={claim.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold">{claim.userName}</h3>
                                  <p className="text-sm text-muted-foreground">{claim.userEmail}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    CSV Record: {claim.csvRecordId}
                                  </p>
                                  {registrationData && (
                                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                                      <p className="text-xs text-green-700">
                                        <strong>Registration Data Available:</strong> {registrationData.name} ({registrationData.userType})
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <Button
                                    onClick={() => createAccount(claim)}
                                    disabled={isLoading || !claim.registrationData}
                                    size="sm"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Create Account
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="created" className="space-y-4">
                  {(!createdAccounts || !Array.isArray(createdAccounts) || createdAccounts.length === 0) ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Created Accounts</h3>
                      <p className="text-muted-foreground">
                        No accounts have been created yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {createdAccounts.map((account) => (
                        <Card key={account.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold">{account.name}</h3>
                                <p className="text-sm text-muted-foreground">{account.email}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                    {account.userType}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    account.isApproved 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {account.isApproved ? 'Approved' : 'Pending'}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Created: {new Date(account.createdAt).toLocaleDateString()}
                                </p>
                                {account.csvRecordId && (
                                  <p className="text-xs text-muted-foreground">
                                    CSV Record: {account.csvRecordId}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4">
                                <Button
                                  onClick={() => deleteAccount(account.id)}
                                  disabled={isLoading}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Account
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
