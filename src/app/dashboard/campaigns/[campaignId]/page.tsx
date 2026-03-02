"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Users, TrendingUp, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";

interface Campaign {
  id: number;
  brandId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  budget: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface Recommendation {
  influencerId: string;
  influencerName: string;
  influencerEmail: string | null;
  matchScore: number;
  scoreBreakdown: {
    categoryMatch: number;
    engagementQuality: number;
    audienceAlignment: number;
    pastCollaborations: number;
    profileCompleteness: number;
    followerRange: number;
    platformMatch: number;
    geographicMatch: number;
    budgetAlignment: number;
  };
  influencer: any;
  collaborationStatus?: string | null;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
      // Only fetch recommendations for brands
      if ((session?.user as any)?.userType === 'brand') {
        fetchRecommendations();
      }
    }
  }, [campaignId, session]);

  const fetchCampaign = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaign(data.campaign);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoadingRecommendations(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/recommendations/campaign/${campaignId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleStartConversation = async (influencerId: string) => {
    if (!session?.user?.id || !campaign) return;

    // Prevent creating conversations with CSV-only influencers (no account)
    if (influencerId.startsWith('csv-')) {
      toast.error("This influencer doesn't have an account. Please view their profile for contact information.");
      router.push(`/dashboard/profile/${encodeURIComponent(influencerId)}?from=campaign-${campaignId}`);
      return;
    }

    try {
      const token = localStorage.getItem("bearer_token");

      // Step 1: Create or get existing conversation
      let conversationId: number;
      let isNewConversation = false;

      const conversationResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participant1Id: session.user.id,
          participant2Id: influencerId,
        }),
      });

      if (conversationResponse.ok) {
        const data = await conversationResponse.json();
        conversationId = data.conversation.id;
        isNewConversation = true; // New conversation created
      } else if (conversationResponse.status === 409) {
        const data = await conversationResponse.json();
        conversationId = data.conversationId;
        isNewConversation = false; // Conversation already exists
      } else {
        const errorData = await conversationResponse.json().catch(() => ({}));
        if (errorData.code === 'SQLITE_CONSTRAINT_FOREIGNKEY' || errorData.code === 'USER_NOT_FOUND') {
          toast.error("This influencer doesn't have an account. Please view their profile for contact information.");
          router.push(`/dashboard/profile/${encodeURIComponent(influencerId)}?from=campaign-${campaignId}`);
          return;
        } else {
          throw new Error("Failed to start conversation");
        }
      }

      // Step 2: Send automatic greeting message with campaign details (only for new conversations)
      if (isNewConversation) {
        const brandName = (session.user as any).name || "We";
        const campaignDetails = [
          `Campaign: ${campaign.title}`,
          campaign.description ? `Description: ${campaign.description}` : null,
          campaign.category ? `Category: ${campaign.category}` : null,
          campaign.budget ? `Budget: ${campaign.budget}` : null,
        ].filter(Boolean).join('\n');

        const greetingMessage = `Hi! I'm ${brandName} and I'm interested in collaborating with you for our campaign "${campaign.title}".

${campaignDetails}

We believe your content and audience align perfectly with our campaign goals. Would you be interested in discussing this collaboration opportunity? I'd love to share more details and answer any questions you might have.

Looking forward to hearing from you!`;

        const messageResponse = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            senderId: session.user.id,
            conversationId: conversationId,
            content: greetingMessage,
          }),
        });

        if (!messageResponse.ok) {
          console.error("Failed to send automatic message, but conversation was created");
        }

        toast.success("Message sent! Redirecting to chat...");
      } else {
        toast.success("Redirecting to chat...");
      }

      // Step 3: Navigate to chat page
      setTimeout(() => {
        router.push(`/dashboard/chat?conversation=${conversationId}`);
      }, 500);

    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  const handleSendInvite = async (influencerId: string) => {
    if (!campaign) return;

    try {
      setIsSendingInvite(influencerId);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/collaborations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          influencerId,
          campaignId: campaign.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Invite sent successfully!");
        // Update local state to reflect pending status
        setRecommendations(prev => prev.map(rec =>
          rec.influencerId === influencerId
            ? { ...rec, collaborationStatus: 'pending' }
            : rec
        ));
      } else {
        toast.error(data.error || "Failed to send invite");
      }
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("An error occurred while sending the invite");
    } finally {
      setIsSendingInvite(null);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!session?.user || (session.user as any).userType !== 'brand') return;

    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setCampaign(data.campaign);
        toast.success(`Campaign status updated to ${newStatus}`);
      } else {
        throw new Error("Failed to update campaign status");
      }
    } catch (error) {
      console.error("Error updating campaign status:", error);
      toast.error("Failed to update campaign status");
    }
  };

  const handleContactBrand = async () => {
    if (!session?.user || !campaign) return;

    try {
      const token = localStorage.getItem("bearer_token");
      const influencerId = session.user.id;
      const brandId = campaign.brandId;
      const influencerName = (session.user as any).name || "I";

      // Step 1: Create or get existing conversation
      let conversationId: number;

      const conversationResponse = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participant1Id: influencerId,
          participant2Id: brandId,
        }),
      });

      if (conversationResponse.ok) {
        const data = await conversationResponse.json();
        conversationId = data.conversation.id;
      } else if (conversationResponse.status === 409) {
        // Conversation already exists
        const data = await conversationResponse.json();
        conversationId = data.conversationId;
      } else {
        throw new Error("Failed to create conversation");
      }

      // Step 2: Send greeting message
      const greetingMessage = `Hi! I'm ${influencerName} and I'm interested in your "${campaign.title}" campaign. Could you please share more details about this opportunity?`;

      const messageResponse = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderId: influencerId,
          conversationId: conversationId,
          content: greetingMessage,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error("Failed to send message");
      }

      toast.success("Message sent! Redirecting to chat...");

      // Step 3: Navigate to chat page
      setTimeout(() => {
        router.push(`/dashboard/chat?conversation=${conversationId}`);
      }, 500);

    } catch (error) {
      console.error("Error contacting brand:", error);
      toast.error("Failed to contact brand. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!campaign) {
    return (
      <PlatformLayout>
        <div className="p-8">
          <p className="text-muted-foreground">Campaign not found</p>
        </div>
      </PlatformLayout>
    );
  }

  const userType = (session?.user as any)?.userType;
  const isBrand = userType === 'brand';

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <Link href={isBrand ? "/dashboard/campaigns" : "/dashboard/campaigns/browse"}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {isBrand ? "My Campaigns" : "Browse Campaigns"}
          </Button>
        </Link>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <div className="flex items-center gap-3">
              <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'completed' ? 'secondary' : 'outline'}>
                {campaign.status}
              </Badge>
              {(session?.user as any)?.userType === 'brand' && (
                <div className="flex gap-2">
                  {campaign.status === 'draft' && (
                    <Button size="sm" onClick={() => handleStatusUpdate('active')}>
                      Activate Campaign
                    </Button>
                  )}
                  {campaign.status === 'active' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('paused')}>
                        Pause
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate('completed')}>
                        Mark as Completed
                      </Button>
                    </>
                  )}
                  {campaign.status === 'paused' && (
                    <Button size="sm" onClick={() => handleStatusUpdate('active')}>
                      Resume
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-muted-foreground">{campaign.description}</p>
          <div className="flex gap-4 mt-4">
            <Badge variant="outline">{campaign.category}</Badge>
            {campaign.budget && (
              <Badge variant="outline">Budget: ${campaign.budget}</Badge>
            )}
          </div>
        </div>

        {isBrand && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Recommended Influencers
              </CardTitle>
              <CardDescription>
                AI-powered recommendations based on your campaign requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRecommendations ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recommendations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No recommendations available. Try adjusting your campaign criteria.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((rec, index) => (
                    <motion.div
                      key={rec.influencerId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={rec.influencer.profile?.imageUrl || rec.influencer.image} />
                            <AvatarFallback>
                              {rec.influencerName.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{rec.influencerName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {rec.influencerEmail}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-500">
                          {rec.matchScore.toFixed(0)}% Match
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Category Match:</span>
                          <span>{rec.scoreBreakdown.categoryMatch}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Engagement:</span>
                          <span>{rec.scoreBreakdown.engagementQuality}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Platform Match:</span>
                          <span>{rec.scoreBreakdown.platformMatch}%</span>
                        </div>
                      </div>

                      {/* Check if influencer has account */}
                      {(() => {
                        const hasAccount = rec.influencer.profile?.dataSource !== 'csv' &&
                          rec.influencer.profile?.isPlatformUser !== false &&
                          !rec.influencerId.startsWith('csv-');

                        return hasAccount ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  router.push(`/dashboard/profile/${rec.influencerId}?from=campaign-${campaignId}`);
                                }}
                              >
                                View Profile
                              </Button>
                              {(rec.collaborationStatus === 'pending' || rec.collaborationStatus === 'active') ? (
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  disabled
                                >
                                  {rec.collaborationStatus === 'pending' ? 'Invite Pending' : 'Active in Campaign'}
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  disabled={isSendingInvite === rec.influencerId}
                                  onClick={() => handleSendInvite(rec.influencerId)}
                                >
                                  {isSendingInvite === rec.influencerId ? "..." : "Invite"}
                                </Button>
                              )}
                            </div>
                            <Button
                              className="w-full"
                              onClick={() => handleStartConversation(rec.influencerId)}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Contact
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                router.push(`/dashboard/profile/${encodeURIComponent(rec.influencerId)}?from=campaign-${campaignId}`);
                              }}
                            >
                              View Profile
                            </Button>
                            <Button
                              className="w-full"
                              disabled
                              variant="secondary"
                              title="This influencer doesn't have an account. View their profile to see contact information."
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              No Account - View Profile to Contact
                            </Button>
                          </div>
                        );
                      })()}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isBrand && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Interested in this campaign?
              </CardTitle>
              <CardDescription>
                Contact the brand to express your interest in collaborating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleContactBrand}
                disabled={!campaign || !session?.user}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Brand
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PlatformLayout>
  );
}

