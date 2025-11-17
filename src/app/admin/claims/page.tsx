"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Eye,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ImageData {
  fileName: string;
  fileUrl: string;
  originalName: string;
  size: number;
  type: string;
}

interface ProfileClaim {
  id: number;
  userId: string;
  csvRecordId: string;
  claimReason: string;
  proofImages: ImageData[] | null;
  idDocument: ImageData | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
}

export default function AdminClaimsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [claims, setClaims] = useState<ProfileClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<ProfileClaim | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    console.log('Admin claims page - session:', session);
    console.log('Admin claims page - isPending:', isPending);
    console.log('Admin claims page - userType:', session?.user?.userType);
    
    if (!isPending && !session?.user) {
      console.log('No session found, redirecting to login');
      router.push("/login");
      return;
    }

    if (session?.user && session.user.userType !== "admin") {
      console.log('User is not admin, userType:', session.user.userType);
      toast.error("Access denied. Admin only.");
      router.push("/dashboard");
      return;
    }

    if (session?.user?.userType === "admin") {
      console.log('User is admin, fetching claims');
      fetchClaims();
    }
  }, [session, isPending, router]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/admin/profile-claims", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch claims");

      const data = await response.json();
      setClaims(data || []);

      // Calculate stats
      const total = data.length;
      const pending = data.filter((c: ProfileClaim) => c.status === 'pending').length;
      const approved = data.filter((c: ProfileClaim) => c.status === 'approved').length;
      const rejected = data.filter((c: ProfileClaim) => c.status === 'rejected').length;

      setStats({ total, pending, approved, rejected });
    } catch (error) {
      toast.error("Failed to load claims");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAction = async (claimId: number, action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/admin/profile-claims", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          claimId,
          action,
          rejectionReason: action === 'reject' ? rejectionReason : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to process claim");

      toast.success(`Claim ${action}d successfully!`);
      setRejectionReason("");
      setSelectedClaim(null);
      await fetchClaims();
    } catch (error) {
      toast.error(`Failed to ${action} claim`);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFilteredClaims = (status: 'pending' | 'approved' | 'rejected') => {
    return claims.filter(claim => claim.status === status);
  };

  if (isPending || loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!session?.user || session.user.userType !== "admin") {
    return null;
  }

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Profile Claims Management</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Review and approve influencer profile claims
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
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
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-2xl font-bold">{stats.rejected}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claims List with Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pending' | 'approved' | 'rejected')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              To Review ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({stats.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Rejected ({stats.rejected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {getFilteredClaims('pending').length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Claims to Review</h3>
                  <p className="text-muted-foreground">
                    There are no pending profile claims to review at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredClaims('pending').map((claim, index) => (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                          {claim.userName.charAt(0)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{claim.userName}</CardTitle>
                          <CardDescription>{claim.userEmail}</CardDescription>
                          <div className="mt-1">
                            {getStatusBadge(claim.status)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Submitted: {new Date(claim.createdAt).toLocaleDateString()}</p>
                        {claim.reviewedAt && (
                          <p>Reviewed: {new Date(claim.reviewedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Claim Reason:</h4>
                        <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                          {claim.claimReason}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {claim.proofImages && (
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Proof Images</span>
                          </div>
                        )}
                        {claim.idDocument && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">ID Document</span>
                          </div>
                        )}
                      </div>

                      {claim.status === 'pending' && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedClaim(claim)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Review Profile Claim</DialogTitle>
                                <DialogDescription>
                                  Review the claim details and supporting documents
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6 pr-2">
                                <div>
                                  <h4 className="font-semibold mb-2">Claimant Details:</h4>
                                  <p><strong>Name:</strong> {claim.userName}</p>
                                  <p><strong>Email:</strong> {claim.userEmail}</p>
                                  <p><strong>CSV Record ID:</strong> {claim.csvRecordId}</p>
                                  {claim.registrationData && (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <h5 className="font-medium text-green-800 mb-2">Registration Data Available:</h5>
                                      <p className="text-sm text-green-700">
                                        Account will be created automatically with the stored registration data when approved.
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Claim Reason:</h4>
                                  <p className="text-sm bg-muted p-3 rounded-lg">{claim.claimReason}</p>
                                </div>

                                {/* Proof Images Section */}
                                {claim.proofImages && claim.proofImages.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-3">Proof Images ({claim.proofImages.length}):</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {claim.proofImages.map((image, index) => (
                                        <div key={index} className="border rounded-lg p-3 bg-muted/20">
                                          <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden border">
                                            <img
                                              src={image.fileUrl}
                                              alt={`Proof image ${index + 1}`}
                                              className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                              onClick={() => window.open(image.fileUrl, '_blank')}
                                              onError={(e) => {
                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
                                              }}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground truncate font-medium">
                                              {image.originalName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {(image.size / 1024).toFixed(1)} KB • {image.type.split('/')[1]?.toUpperCase()}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* ID Document Section */}
                                {claim.idDocument && (
                                  <div>
                                    <h4 className="font-semibold mb-3">ID Document:</h4>
                                    <div className="border rounded-lg p-4 bg-muted/20">
                                      <div className="flex gap-4">
                                        <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden border flex-shrink-0">
                                          <img
                                            src={claim.idDocument.fileUrl}
                                            alt="ID Document"
                                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => window.open(claim.idDocument.fileUrl, '_blank')}
                                            onError={(e) => {
                                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
                                            }}
                                          />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                          <p className="font-medium text-sm">
                                            {claim.idDocument.originalName}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {(claim.idDocument.size / 1024).toFixed(1)} KB • {claim.idDocument.type.split('/')[1]?.toUpperCase()}
                                          </p>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(claim.idDocument.fileUrl, '_blank')}
                                            className="mt-2"
                                          >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Full Size
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <h4 className="font-semibold mb-2">Rejection Reason (if rejecting):</h4>
                                  <Textarea
                                    placeholder="Provide a reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => handleClaimAction(claim.id, 'reject')}
                                  disabled={isProcessing}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleClaimAction(claim.id, 'approve')}
                                  disabled={isProcessing}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}

                      {claim.status === 'rejected' && claim.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <h4 className="font-semibold text-red-800 mb-1">Rejection Reason:</h4>
                          <p className="text-sm text-red-700">{claim.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {getFilteredClaims('approved').length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Approved Claims</h3>
                  <p className="text-muted-foreground">
                    There are no approved profile claims yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredClaims('approved').map((claim, index) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                            {claim.userName.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{claim.userName}</CardTitle>
                            <CardDescription>{claim.userEmail}</CardDescription>
                            <div className="mt-1">
                              {getStatusBadge(claim.status)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>Submitted: {new Date(claim.createdAt).toLocaleDateString()}</p>
                          {claim.reviewedAt && (
                            <p>Approved: {new Date(claim.reviewedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Claim Reason:</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {claim.claimReason}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {getFilteredClaims('rejected').length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Rejected Claims</h3>
                  <p className="text-muted-foreground">
                    There are no rejected profile claims yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredClaims('rejected').map((claim, index) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                            {claim.userName.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{claim.userName}</CardTitle>
                            <CardDescription>{claim.userEmail}</CardDescription>
                            <div className="mt-1">
                              {getStatusBadge(claim.status)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>Submitted: {new Date(claim.createdAt).toLocaleDateString()}</p>
                          {claim.reviewedAt && (
                            <p>Rejected: {new Date(claim.reviewedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Claim Reason:</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {claim.claimReason}
                          </p>
                        </div>
                        {claim.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <h4 className="font-semibold text-red-800 mb-1">Rejection Reason:</h4>
                            <p className="text-sm text-red-700">{claim.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
}
