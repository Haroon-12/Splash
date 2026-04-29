"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  User,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Link from "next/link";

interface ClaimStatus {
  id: string;
  userId: string;
  csvRecordId: string;
  claimReason: string;
  status: 'pending' | 'approved' | 'rejected';
  userName?: string;
  userEmail?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  proofImages?: string[];
  idDocument?: string;
}

function ClaimStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Get claim ID from URL params
    const claimId = searchParams.get('claimId');
    if (claimId) {
      checkClaimStatus(claimId);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

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
        return "🎉 Congratulations! Your profile claim has been approved. You can now log in and edit your profile.";
      case 'rejected':
        return "❌ Your profile claim was rejected. Please review the reason and submit a new claim if needed.";
      default:
        return "⏳ Your profile claim is currently under review. Our admin team will review your submission and notify you of the decision.";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading claim status...</p>
        </div>
      </div>
    );
  }

  if (!claimStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              No Claim Found
            </CardTitle>
            <CardDescription>
              We couldn't find any profile claim with the provided ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Please check the claim ID in your URL or contact support if you believe this is an error.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/register">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Registration
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto pt-8">
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
                    <p className="font-medium">{claimStatus.userName || claimStatus.csvRecordId}</p>
                    {claimStatus.userEmail && (
                      <p className="text-sm text-muted-foreground">{claimStatus.userEmail}</p>
                    )}
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
                    <Link href="/login">
                      <User className="h-4 w-4 mr-2" />
                      Login to Dashboard
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
                  <Link href="/register">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Registration
                  </Link>
                </Button>
              </div>

              {/* Contact Info */}
              <div className="border-t pt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Need help? Contact us at{" "}
                  <a href="mailto:support@splash.com" className="text-primary hover:underline">
                    support@splash.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function PublicClaimStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading claim status...</p>
        </div>
      </div>
    }>
      <ClaimStatusContent />
    </Suspense>
  );
}

