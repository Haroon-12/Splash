"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Search, Instagram, Youtube, Facebook, MessageSquare, Mail as MailIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface DirectoryInfluencer {
  name: string;
  category: string | null;
  socials: {
    instagram: string | null;
    youtube: string | null;
    facebook: string | null;
    tiktok: string | null;
  };
  imageUrl: string | null;
  description: string | null;
  previousBrands: string | null;
  gender: string | null;
  email: string | null;
  isPlatformUser: boolean;
  platformUserId: string | null;
  platformImage: string | null;
  // Additional CSV data
  instagramFollowers: string | null;
  youtubeFollowers: string | null;
  facebookFollowers: string | null;
  tiktokFollowers: string | null;
  activeHours: string | null;
  notes: string | null;
  // Data source
  dataSource: 'csv' | 'database';
}

export default function BrowseInfluencersPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function to format follower counts consistently
  const formatFollowerCount = (count: string | null) => {
    if (!count || count === '') return 'N/A';
    
    // If already formatted (contains K or M), return as is
    if (count.includes('K') || count.includes('M')) {
      return count;
    }
    
    // If it's a number, format it
    const number = parseInt(count.replace(/,/g, ''));
    if (isNaN(number)) return count;
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
    return number.toString();
  };
  const [influencers, setInfluencers] = useState<DirectoryInfluencer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchInfluencers();
    }
  }, [session, isPending, router]);

  const fetchInfluencers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/influencers-with-accounts");

      if (!response.ok) {
        throw new Error("Failed to fetch influencers");
      }

      const data = await response.json();
      // Transform the data to match the expected interface
      const transformedData = data.map((influencer: any) => ({
        name: influencer.name,
        category: influencer.category,
        socials: {
          instagram: influencer.instagram,
          youtube: influencer.youtube,
          facebook: influencer.facebook,
          tiktok: influencer.tiktok,
        },
        imageUrl: influencer.imageUrl,
        description: influencer.description,
        previousBrands: influencer.previousBrands,
        gender: influencer.gender,
        email: influencer.email,
        isPlatformUser: influencer.hasAccount,
        platformUserId: influencer.userId,
        platformImage: influencer.imageUrl,
        // Add additional CSV data
        instagramFollowers: influencer.instagramFollowers,
        youtubeFollowers: influencer.youtubeFollowers,
        facebookFollowers: influencer.facebookFollowers,
        tiktokFollowers: influencer.tiktokFollowers,
        activeHours: influencer.activeHours,
        notes: influencer.notes,
        // Data source
        dataSource: influencer.dataSource || 'csv',
      }));
      setInfluencers(transformedData);
    } catch (error) {
      console.error("Error fetching influencers:", error);
      toast.error("Failed to load influencers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async (influencer: DirectoryInfluencer) => {
    if (!session?.user?.id) return;

    try {
      if (!influencer.isPlatformUser || !influencer.platformUserId) {
        toast.error("This influencer hasn't created an account yet.");
        return;
      }
      const token = localStorage.getItem("bearer_token");
      
      // Check if conversation already exists
      const existingConvResponse = await fetch(
        `/api/conversations?userId=${session.user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (existingConvResponse.ok) {
        const conversations = await existingConvResponse.json();
        const existingConv = conversations.find(
          (c: any) =>
            c.participant1Id === influencer.platformUserId || c.participant2Id === influencer.platformUserId
        );

        if (existingConv) {
          router.push(`/dashboard/chat?conversation=${existingConv.id}`);
          return;
        }
      }

      // Create new conversation
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          participant1Id: session.user.id,
          participant2Id: influencer.platformUserId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Conversation started!");
        router.push(`/dashboard/chat?conversation=${data.conversation.id}`);
      } else if (response.status === 409) {
        const data = await response.json();
        router.push(`/dashboard/chat?conversation=${data.conversationId}`);
      } else {
        throw new Error("Failed to start conversation");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    }
  };

  if (isPending || isLoading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  const isBrand = session.user.userType === "brand";

  const filteredInfluencers = influencers.filter((influencer) =>
    influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (influencer.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (influencer.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {isBrand ? "Browse Influencers" : "Explore Network"}
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            {isBrand
              ? "Find the perfect influencers for your brand campaigns"
              : "Connect with other influencers and explore collaboration opportunities"}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-6 lg:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Influencers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredInfluencers.map((influencer, index) => (
            <motion.div
              key={influencer.name + (influencer.email || '')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-card rounded-xl lg:rounded-2xl p-5 lg:p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer group relative overflow-hidden"
            >
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 lg:h-16 lg:w-16 flex-shrink-0">
                    <AvatarImage 
                      src={influencer.platformImage || influencer.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${influencer.name}`} 
                      alt={influencer.name} 
                    />
                    <AvatarFallback>{influencer.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{influencer.name}</h3>
                    <div className="text-sm text-muted-foreground">
                      {influencer.email || "No email provided"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {influencer.isPlatformUser ? (
                    <Badge variant="outline" className="text-xs text-green-600">✓ Has Account</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">CSV Only</Badge>
                  )}
                </div>
              </div>

              {/* Category Badge */}
              {influencer.category && (
                <Badge variant="secondary" className="mb-3">
                  {influencer.category}
                </Badge>
              )}

              {/* Bio */}
              <div className="mb-4">
                {influencer.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{influencer.description}</p>
                )}
                {influencer.previousBrands && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    <strong>Previous Brands:</strong> {influencer.previousBrands}
                  </p>
                )}
                {influencer.activeHours && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    <strong>Active:</strong> {influencer.activeHours}
                  </p>
                )}
                {influencer.gender && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    <strong>Gender:</strong> {influencer.gender}
                  </p>
                )}
              </div>

              {/* Social Platforms with Follower Counts */}
              <div className="space-y-2 mb-4">
                {influencer.socials.instagram && (
                  <div className="flex items-center justify-between">
                    <a
                      aria-label="Instagram"
                      title="Instagram"
                      className="inline-flex items-center gap-2 text-sm hover:opacity-90"
                      href={influencer.socials.instagram}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] text-white">
                        <Instagram className="h-3 w-3" />
                      </div>
                      <span className="text-muted-foreground">Instagram</span>
                    </a>
                    <span className="text-xs font-medium">
                      {formatFollowerCount(influencer.instagramFollowers)}
                    </span>
                  </div>
                )}
                {influencer.socials.youtube && (
                  <div className="flex items-center justify-between">
                    <a
                      aria-label="YouTube"
                      title="YouTube"
                      className="inline-flex items-center gap-2 text-sm hover:opacity-90"
                      href={influencer.socials.youtube}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FF0000] text-white">
                        <Youtube className="h-3 w-3" />
                      </div>
                      <span className="text-muted-foreground">YouTube</span>
                    </a>
                    <span className="text-xs font-medium">
                      {formatFollowerCount(influencer.youtubeFollowers)}
                    </span>
                  </div>
                )}
                {influencer.socials.tiktok && (
                  <div className="flex items-center justify-between">
                    <a
                      aria-label="TikTok"
                      title="TikTok"
                      className="inline-flex items-center gap-2 text-sm hover:opacity-90"
                      href={influencer.socials.tiktok}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                        <span className="text-[8px] leading-none">TT</span>
                      </div>
                      <span className="text-muted-foreground">TikTok</span>
                    </a>
                    <span className="text-xs font-medium">
                      {formatFollowerCount(influencer.tiktokFollowers)}
                    </span>
                  </div>
                )}
                {influencer.socials.facebook && (
                  <div className="flex items-center justify-between">
                    <a
                      aria-label="Facebook"
                      title="Facebook"
                      className="inline-flex items-center gap-2 text-sm hover:opacity-90"
                      href={influencer.socials.facebook}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-white">
                        <Facebook className="h-3 w-3" />
                      </div>
                      <span className="text-muted-foreground">Facebook</span>
                    </a>
                    <span className="text-xs font-medium">
                      {formatFollowerCount(influencer.facebookFollowers)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    // Use csvRecordId for consistent profile viewing
                    const profileId = influencer.platformUserId || influencer.name + (influencer.email ? `-${influencer.email}` : '-no-email');
                    router.push(`/dashboard/profile/${encodeURIComponent(profileId)}`);
                  }}
                >
                  View Profile
                </Button>
                {isBrand && (
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    disabled={!influencer.isPlatformUser}
                    onClick={() => handleStartConversation(influencer)}
                  >
                    {influencer.isPlatformUser ? (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </>
                    ) : (
                      'No Account'
                    )}
                  </Button>
                )}
              </div>

              {/* Account Status Badge */}
              {!influencer.isPlatformUser && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This influencer hasn't joined yet
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {filteredInfluencers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery 
                ? "No influencers found matching your search." 
                : "No approved influencers yet."}
            </p>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}