"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Search, Instagram, Youtube, Facebook, MessageSquare, Mail as MailIcon, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  matchesSearch, 
  influencerMatchesSearch, 
  matchesCategoryFilter, 
  matchesFollowerRange, 
  matchesPlatformFilter,
  parseFollowerCount 
} from "@/lib/search-utils";

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
  const [filters, setFilters] = useState({
    category: "",
    minFollowers: "",
    maxFollowers: "",
    platforms: [] as string[],
  });

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

  // Simple search and filter - NO recommendations
  // Just display all influencers, filtered by search and filters
  const influencersToDisplay = influencers;

  // Calculate search relevance score for sorting - improved for better accuracy
  const calculateSearchRelevance = (influencer: any, query: string): number => {
    if (!query.trim()) return 0;
    
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    let relevance = 0;
    
    const nameLower = influencer.name?.toLowerCase() || '';
    const emailLower = influencer.email?.toLowerCase() || '';
    
    // Exact name match - highest priority (10000 points)
    if (nameLower === queryLower) {
      relevance += 10000;
    }
    // Name starts with query - very high priority
    else if (nameLower.startsWith(queryLower)) {
      relevance += 5000;
    }
    // All query words appear in name (in order) - high priority
    else if (queryWords.length > 1 && queryWords.every(word => nameLower.includes(word))) {
      // Check if words appear in order
      let lastIndex = -1;
      const wordsInOrder = queryWords.every(word => {
        const index = nameLower.indexOf(word, lastIndex + 1);
        if (index > lastIndex) {
          lastIndex = index;
          return true;
        }
        return false;
      });
      if (wordsInOrder) {
        relevance += 4000;
      } else {
        relevance += 3000;
      }
    }
    // Name contains query as substring
    else if (nameLower.includes(queryLower)) {
      relevance += 2000;
    }
    // Name contains all query words (anywhere)
    else if (queryWords.length > 1 && queryWords.every(word => nameLower.includes(word))) {
      relevance += 1500;
    }
    // Name contains any query word
    else if (queryWords.some(word => nameLower.includes(word))) {
      relevance += 500;
    }
    
    // Exact email match - very high priority
    if (emailLower === queryLower) {
      relevance += 8000;
    }
    // Email contains query
    else if (emailLower.includes(queryLower)) {
      relevance += 1000;
    }
    
    // Category exact match
    const categoryLower = influencer.category?.toLowerCase() || '';
    if (categoryLower === queryLower) {
      relevance += 2000;
    }
    // Category contains query
    else if (categoryLower.includes(queryLower)) {
      relevance += 400;
    }
    
    // Description contains query (lower priority)
    if (influencer.description?.toLowerCase().includes(queryLower)) {
      relevance += 200;
    }
    
    // Other fields (lowest priority)
    if (influencer.previousBrands?.toLowerCase().includes(queryLower)) {
      relevance += 100;
    }
    if (influencer.notes?.toLowerCase().includes(queryLower)) {
      relevance += 50;
    }
    
    return relevance;
  };

  // Apply filters and search - simple search and filter, NO recommendations
  const trimmedSearchQuery = searchQuery.trim();
  const filteredInfluencers = influencersToDisplay
    .filter((influencer) => {
      // STRICT SEARCH: Only check name and email - nothing else
      if (trimmedSearchQuery) {
        // Check name first - must match
        const nameMatch = matchesSearch(influencer.name, trimmedSearchQuery);
        if (nameMatch) {
          // Name matches - continue to filter checks below
        } else {
          // If name doesn't match, check email
          const emailMatch = matchesSearch(influencer.email, trimmedSearchQuery);
          if (!emailMatch) {
            // Neither name nor email matches - EXCLUDE this profile immediately
            return false;
          }
          // Email matches - continue to filter checks below
        }
      }
    
    // Apply filters - only if they have actual values (not empty/default)
    {
      // Category filter - only apply if explicitly set (not empty, not "all")
      if (filters.category && filters.category !== "all" && filters.category.trim() !== "") {
        const filterCategory = filters.category.toLowerCase();
        const influencerCategory = (influencer.category || '').toLowerCase();
        
        if (!influencerCategory) {
          return false; // No category = doesn't match
        }
        
        // Exact match
        if (filterCategory === influencerCategory) {
          // Match
        }
        // Partial match (one contains the other)
        else if (influencerCategory.includes(filterCategory) || filterCategory.includes(influencerCategory)) {
          // Match
        }
        // Word-based matching
        else {
          const filterWords = filterCategory.split(/\s+/);
          const influencerWords = influencerCategory.split(/\s+/);
          const hasCommonWord = filterWords.some(fw => 
            influencerWords.some(iw => iw.includes(fw) || fw.includes(iw))
          );
          
          if (!hasCommonWord) {
            return false; // No common words = doesn't match
          }
        }
      }
      
      // Follower range filter - only apply if explicitly set (not empty string)
      const minFollowersStr = filters.minFollowers?.toString().trim() || '';
      const maxFollowersStr = filters.maxFollowers?.toString().trim() || '';
      const minFollowersNum = minFollowersStr ? parseInt(minFollowersStr) : null;
      const maxFollowersNum = maxFollowersStr ? parseInt(maxFollowersStr) : null;
      
      // Only apply filter if we have valid numbers (not empty strings, not NaN)
      if ((minFollowersNum !== null && !isNaN(minFollowersNum)) || (maxFollowersNum !== null && !isNaN(maxFollowersNum))) {
        const totalFollowers = 
          parseFollowerCount(influencer.instagramFollowers) +
          parseFollowerCount(influencer.youtubeFollowers) +
          parseFollowerCount(influencer.facebookFollowers) +
          parseFollowerCount(influencer.tiktokFollowers);
        
        if (minFollowersNum !== null && !isNaN(minFollowersNum) && totalFollowers < minFollowersNum) {
          return false;
        }
        if (maxFollowersNum !== null && !isNaN(maxFollowersNum) && totalFollowers > maxFollowersNum) {
          return false;
        }
      }
      
      // Platform filter - only apply if explicitly selected
      if (filters.platforms && filters.platforms.length > 0) {
        const hasPlatform = filters.platforms.some(platform => {
          const platformLower = platform.toLowerCase();
          return (
            (platformLower === 'instagram' && influencer.socials.instagram) ||
            (platformLower === 'youtube' && influencer.socials.youtube) ||
            (platformLower === 'facebook' && influencer.socials.facebook) ||
            (platformLower === 'tiktok' && influencer.socials.tiktok)
          );
        });
        
        if (!hasPlatform) {
          return false;
        }
      }
    }
    
    return true;
  })
  .map(influencer => ({
    ...influencer,
    // Calculate search relevance for sorting
    searchRelevance: trimmedSearchQuery 
      ? calculateSearchRelevance(influencer, trimmedSearchQuery)
      : 0,
  }))
  .sort((a, b) => {
    // CRITICAL: If there's a search query, ALWAYS prioritize search relevance FIRST
    if (trimmedSearchQuery) {
      const aRelevance = (a as any).searchRelevance || 0;
      const bRelevance = (b as any).searchRelevance || 0;
      const relevanceDiff = bRelevance - aRelevance;
      
      if (relevanceDiff !== 0) {
        // Higher relevance comes first - this ensures exact matches are on top
        return relevanceDiff;
      }
      
      // Finally, sort alphabetically
      return a.name.localeCompare(b.name);
    }
    
    // No search query - sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
  

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
        <div className="space-y-4 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
                placeholder="Search by name, email, category, description, or previous brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          </div>
          
          {isBrand && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select
                      value={filters.category || "all"}
                      onValueChange={(value) => {
                        setFilters(prev => ({ ...prev, category: value === "all" ? "" : value }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any category" />
                        {/* Ensure "all" is the default and doesn't filter */}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any category</SelectItem>
                        <SelectItem value="Fashion & Lifestyle">Fashion & Lifestyle</SelectItem>
                        <SelectItem value="Travel & Adventure">Travel & Adventure</SelectItem>
                        <SelectItem value="Food & Cooking">Food & Cooking</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Fitness & Health">Fitness & Health</SelectItem>
                        <SelectItem value="Beauty & Skincare">Beauty & Skincare</SelectItem>
                        <SelectItem value="Gaming">Gaming</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Business & Finance">Business & Finance</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Min Followers</label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={filters.minFollowers}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, minFollowers: e.target.value }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Max Followers</label>
                    <Input
                      type="number"
                      placeholder="1000000"
                      value={filters.maxFollowers}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, maxFollowers: e.target.value }));
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium mb-2 block">Platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {['Instagram', 'YouTube', 'TikTok', 'Facebook'].map((platform) => (
                      <label key={platform} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.platforms.includes(platform)}
                          onChange={(e) => {
                            setFilters(prev => {
                              const newPlatforms = e.target.checked
                                ? [...prev.platforms, platform]
                                : prev.platforms.filter(p => p !== platform);
                              return { ...prev, platforms: newPlatforms };
                            });
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{platform}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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