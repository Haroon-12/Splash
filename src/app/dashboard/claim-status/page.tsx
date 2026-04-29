"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  FileText,
  User
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

interface ClaimStatus {
  id: number;
  userId: string;
  csvRecordId: string;
  claimReason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
}

function ClaimStatusContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Get claim ID from URL params or localStorage
    const claimId = searchParams.get('claimId') || localStorage.getItem('lastClaimId');
    if (claimId) {
      checkClaimStatus(claimId);
    } else {
      setLoading(false);
    }
  }, [session, router, searchParams]);

  const checkClaimStatus = async (claimId: string) => {
    setChecking(true);
    try {
      const response = await fetch(`/api/claim-status/${claimId}`);
      if (response.ok) {
        const data = await response.json();
        setClaimStatus(data.claim);
      } else {
        toast.error("Failed to check claim status");
      }
    } catch (error) {
      console.error("Error checking claim status:", error);
      toast.error("Failed to check claim status");
    } finally {
      setChecking(false);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending Review</Badge>;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return "🎉 Congratulations! Your profile claim has been approved. You can now edit your profile and start connecting with brands.";
      case 'rejected':
        return "❌ Your profile claim was rejected. Please review the reason and submit a new claim if needed.";
      default:
        return "⏳ Your profile claim is currently under review. Our admin team will review your submission and notify you of the decision.";
    }
  };

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!claimStatus) {
    return (
      <PlatformLayout>
        <div className="p-4 lg:p-8 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                No Claim Found
              </CardTitle>
              <CardDescription>
                We couldn't find any profile claim associated with your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you recently submitted a profile claim, please wait a moment and try checking again.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {getStatusIcon(claimStatus.status)}
              </div>
              <CardTitle className="text-2xl">
                Profile Claim Status
              </CardTitle>
              <div className="flex justify-center">
                {getStatusBadge(claimStatus.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Status Message */}
              <div className="text-center">
                <p className="text-muted-foreground">
                  {getStatusMessage(claimStatus.status)}
                </p>
              </div>

              {/* Claim Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Claim Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Profile</label>
                    <p className="font-medium">{claimStatus.csvRecordId}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                    <p className="font-medium">
                      {new Date(claimStatus.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Claim Reason</label>
                    <p className="font-medium">{claimStatus.claimReason}</p>
                  </div>
                </div>

                {/* Review Details (if reviewed) */}
                {claimStatus.reviewedAt && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Review Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Reviewed By</label>
                        <p className="font-medium">{claimStatus.reviewedBy || 'Admin'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Reviewed On</label>
                        <p className="font-medium">
                          {new Date(claimStatus.reviewedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {claimStatus.rejectionReason && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Rejection Reason</label>
                          <p className="font-medium text-red-600">{claimStatus.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => checkClaimStatus(claimStatus.id.toString())}
                  disabled={checking}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? 'Checking...' : 'Check Status'}
                </Button>
                
                {claimStatus.status === 'approved' && (
                  <Button asChild className="flex-1">
                    <Link href="/dashboard/profile/edit">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                )}
                
                {claimStatus.status === 'rejected' && (
                  <Button variant="outline" asChild className="flex-1">
                    <Link href="/register">
                      Submit New Claim
                    </Link>
                  </Button>
                )}
                
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}

export default function ClaimStatusPage() {
  return (
    <Suspense fallback={
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    }>
      <ClaimStatusContent />
    </Suspense>
  );
}
