"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Instagram, 
  Youtube, 
  Facebook, 
  MessageSquare, 
  ArrowLeft,
  Users,
  Heart,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Star,
  ExternalLink,
  User,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";

interface InfluencerProfile {
  csvRecordId: string;
  name: string;
  email: string | null;
  category: string;
  instagram: string;
  youtube: string;
  facebook: string;
  tiktok: string;
  imageUrl: string;
  description: string;
  previousBrands: string;
  gender: string;
  activeHours: string;
  images: string;
  notes: string;
  instagramFollowers: string;
  instagramLikes: string;
  instagramViews: string;
  youtubeFollowers: string;
  youtubeLikes: string;
  youtubeViews: string;
  facebookFollowers: string;
  facebookLikes: string;
  facebookViews: string;
  tiktokFollowers: string;
  tiktokLikes: string;
  tiktokViews: string;
  hasAccount: boolean;
  userId: string | null;
  isApproved: boolean;
  preferredBrands?: string;
  contentPreferences?: string;
  geographicReach?: string;
  portfolioSamples?: string;
  rateCard?: string;
  availability?: string;
  verificationBadges?: string;
}

export default function InfluencerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [params.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/influencers-with-accounts");
      if (!response.ok) throw new Error("Failed to fetch influencers");
      
      const influencers = await response.json();
      const influencer = influencers.find((inf: InfluencerProfile) => 
        inf.csvRecordId === params.id || 
        inf.userId === params.id ||
        inf.name === params.id ||
        inf.email === params.id
      );
      
      if (influencer) {
        setProfile(influencer);
      } else {
        // If not found in influencers list, try to fetch from CSV directly
        // Extract potential search parameters from the ID
        const idString = decodeURIComponent(params.id as string);
        
        // Try different search strategies
        const searchParams = new URLSearchParams();
        
        // If it looks like a csvRecordId (Name-email format)
        if (idString.includes('-')) {
          const [name, email] = idString.split('-');
          if (name) searchParams.set('name', name);
          if (email && email !== 'no-email') searchParams.set('email', email);
        } else {
          // Try as name or email directly
          if (idString.includes('@')) {
            searchParams.set('email', idString);
          } else {
            searchParams.set('name', idString);
          }
        }
        
        // Try to fetch from CSV with flexible matching
        const csvResponse = await fetch(`/api/csv-data?${searchParams.toString()}`);
        if (csvResponse.ok) {
          const csvData = await csvResponse.json();
          // Convert CSV data to influencer profile format
          const csvProfile: InfluencerProfile = {
            csvRecordId: csvData.csvRecordId,
            name: csvData.name,
            email: csvData.email,
            category: csvData.category,
            instagram: csvData.instagram,
            youtube: csvData.youtube,
            facebook: csvData.facebook,
            tiktok: csvData.tiktok,
            imageUrl: csvData.imageUrl,
            description: csvData.description,
            previousBrands: csvData.previousBrands,
            gender: csvData.gender,
            activeHours: csvData.activeHours,
            images: csvData.images,
            notes: csvData.notes,
            instagramFollowers: csvData.instagramFollowers,
            instagramLikes: csvData.instagramLikes,
            instagramViews: csvData.instagramViews,
            youtubeFollowers: csvData.youtubeFollowers,
            youtubeLikes: csvData.youtubeLikes,
            youtubeViews: csvData.youtubeViews,
            facebookFollowers: csvData.facebookFollowers,
            facebookLikes: csvData.facebookLikes,
            facebookViews: csvData.facebookViews,
            tiktokFollowers: csvData.tiktokFollowers,
            tiktokLikes: csvData.tiktokLikes,
            tiktokViews: csvData.tiktokViews,
            hasAccount: false, // CSV-only profile
            userId: null,
            isApproved: false,
          };
          setProfile(csvProfile);
        } else {
          toast.error("Influencer not found");
          router.push("/dashboard/browse-influencers");
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
      router.push("/dashboard/browse-influencers");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: string) => {
    if (!num || num === '') return 'N/A';
    
    // If already formatted (contains K, M, or B), return as is but try to improve formatting
    if (num.includes('K') || num.includes('M') || num.includes('B')) {
      // Check if the number is in the millions but should be in billions
      const cleanNum = num.replace(/[^0-9.]/g, ''); // Remove K, M, B
      const parsedNum = parseFloat(cleanNum);
      
      if (num.includes('M') && parsedNum >= 1000) {
        // Convert to billions (e.g., 1742.1M becomes 1.7421B)
        return `${(parsedNum / 1000).toFixed(4)}B`;
      }
      
      return num;
    }
    
    // If it's a number, format it
    const number = parseFloat(num.replace(/,/g, ''));
    if (isNaN(number)) return num;
    if (number >= 1000000000) return `${(number / 1000000000).toFixed(2)}B`;
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
    return number.toString();
  };

  const parseJson = <T,>(value?: string | null): T | null => {
    if (!value || typeof value !== 'string') return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  };

  const handleMessage = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to send messages");
      return;
    }

    if (!profile?.hasAccount || !profile?.userId) {
      toast.error("This influencer doesn't have an account yet");
      return;
    }

    try {
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
            c.participant1Id === profile.userId || c.participant2Id === profile.userId
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
          participant2Id: profile.userId,
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

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!profile) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
              <CardTitle className="text-red-500">Profile Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">The requested influencer profile could not be found.</p>
              <Button onClick={() => router.push("/dashboard/browse-influencers")} variant="outline">
                Back to Browse
              </Button>
            </CardContent>
          </Card>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Influencer Profile</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage 
                        src={profile.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`} 
                        alt={profile.name} 
                      />
                      <AvatarFallback className="text-2xl">
                        {profile.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h2 className="text-xl font-bold mb-2">{profile.name}</h2>
                    <Badge variant="secondary" className="mb-3">{profile.category}</Badge>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                      {profile.hasAccount ? (
                        <Badge variant="default" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          Has Account
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          CSV Only
                        </Badge>
                      )}
                      {profile.hasAccount && profile.isApproved && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          <Star className="h-3 w-3 mr-1" />
                          Approved
                        </Badge>
                      )}
                    </div>

                    {profile.email && (
                      <p className="text-sm text-muted-foreground mb-4">{profile.email}</p>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleMessage}
                      disabled={!profile.hasAccount || !profile.isApproved}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {!profile.hasAccount ? "No Account" : 
                       !profile.isApproved ? "Not Approved" : "Send Message"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Social Media Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.instagram && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-500" />
                        <span className="text-sm">Instagram</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(profile.instagramFollowers)}</p>
                        <p className="text-xs text-muted-foreground">followers</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.youtube && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-red-500" />
                        <span className="text-sm">YouTube</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(profile.youtubeFollowers)}</p>
                        <p className="text-xs text-muted-foreground">subscribers</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.tiktok && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-black rounded flex items-center justify-center">
                          <span className="text-white text-xs">TT</span>
                        </div>
                        <span className="text-sm">TikTok</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(profile.tiktokFollowers)}</p>
                        <p className="text-xs text-muted-foreground">followers</p>
                      </div>
                    </div>
                  )}
                  
                  {profile.facebook && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Facebook className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Facebook</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(profile.facebookFollowers)}</p>
                        <p className="text-xs text-muted-foreground">followers</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Detailed Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {profile.description || profile.notes || "No description available"}
                  </p>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.instagram && (
                      <a
                        href={profile.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <div>
                          <p className="font-medium">Instagram</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(profile.instagramFollowers)} followers
                          </p>
                        </div>
                      </a>
                    )}
                    
                    {profile.youtube && (
                      <a
                        href={profile.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <Youtube className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium">YouTube</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(profile.youtubeFollowers)} subscribers
                          </p>
                        </div>
                      </a>
                    )}
                    
                    {profile.tiktok && (
                      <a
                        href={profile.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="h-5 w-5 bg-black rounded flex items-center justify-center">
                          <span className="text-white text-xs">TT</span>
                        </div>
                        <div>
                          <p className="font-medium">TikTok</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(profile.tiktokFollowers)} followers
                          </p>
                        </div>
                      </a>
                    )}
                    
                    {profile.facebook && (
                      <a
                        href={profile.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <Facebook className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Facebook</p>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(profile.facebookFollowers)} followers
                          </p>
                        </div>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Previous Brands */}
                {profile.previousBrands && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Previous Brands</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{profile.previousBrands}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Active Hours */}
                {profile.activeHours && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Active Hours
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <p className="text-sm font-medium">{profile.activeHours}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gender */}
                {profile.gender && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Gender
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          profile.gender?.toLowerCase() === 'male' 
                            ? 'bg-blue-100 text-blue-600' 
                            : profile.gender?.toLowerCase() === 'female'
                            ? 'bg-pink-100 text-pink-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <User className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium capitalize">{profile.gender}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Engagement Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Engagement Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {profile.instagramLikes && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Instagram Likes:</span>
                        <span className="text-sm font-medium">{formatNumber(profile.instagramLikes)}</span>
                      </div>
                    )}
                    {profile.instagramViews && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Instagram Views:</span>
                        <span className="text-sm font-medium">{formatNumber(profile.instagramViews)}</span>
                      </div>
                    )}
                    {profile.youtubeLikes && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">YouTube Likes:</span>
                        <span className="text-sm font-medium">{formatNumber(profile.youtubeLikes)}</span>
                      </div>
                    )}
                    {profile.youtubeViews && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">YouTube Views:</span>
                        <span className="text-sm font-medium">{formatNumber(profile.youtubeViews)}</span>
                      </div>
                    )}
                    {profile.facebookLikes && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Facebook Likes:</span>
                        <span className="text-sm font-medium">{formatNumber(profile.facebookLikes)}</span>
                      </div>
                    )}
                    {profile.facebookViews && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Facebook Views:</span>
                        <span className="text-sm font-medium">{formatNumber(profile.facebookViews)}</span>
                      </div>
                    )}
                    {profile.tiktokLikes && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">TikTok Likes:</span>
                        <span className="text-sm font-medium">{formatNumber(profile.tiktokLikes)}</span>
                      </div>
                    )}
                    {profile.tiktokViews && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">TikTok Views:</span>
                        <span className="text-sm font-medium">{formatNumber(profile.tiktokViews)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Preferences */}
                {(profile.preferredBrands || profile.contentPreferences || profile.geographicReach) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {profile.preferredBrands && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Preferred Brands</div>
                          <div className="flex flex-wrap gap-2">
                            {(parseJson<string[]>(profile.preferredBrands) || String(profile.preferredBrands).split(',').map(s => s.trim()).filter(Boolean)).map((b, idx) => (
                              <Badge key={idx} variant="secondary" className="px-2 py-1 text-xs">{b}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.contentPreferences && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Content Preferences</div>
                          <div className="flex flex-wrap gap-2">
                            {(parseJson<string[]>(profile.contentPreferences) || String(profile.contentPreferences).split(',').map(s => s.trim()).filter(Boolean)).map((c, idx) => (
                              <Badge key={idx} variant="outline" className="px-2 py-1 text-xs">{c}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.geographicReach && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-2">Geographic Reach</div>
                          <div className="flex flex-wrap gap-2">
                            {(parseJson<string[]>(profile.geographicReach) || String(profile.geographicReach).split(',').map(s => s.trim()).filter(Boolean)).map((g, idx) => (
                              <Badge key={idx} className="px-2 py-1 text-xs">{g}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Advanced */}
                {(profile.portfolioSamples || profile.images || profile.rateCard || profile.availability || profile.verificationBadges) && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Advanced</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {profile.images && (
                        <div>
                          <div className="text-sm font-medium mb-3">Images</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {(parseJson<string[]>(profile.images) || []).map((src, idx) => (
                              <div key={idx} className="aspect-square rounded-lg overflow-hidden border bg-muted">
                                <img src={src} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.portfolioSamples && (
                        <div>
                          <div className="text-sm font-medium mb-3">Portfolio Samples</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {(parseJson<string[]>(profile.portfolioSamples) || []).map((url, idx) => (
                              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block p-3 border rounded hover:bg-accent text-sm truncate">{url}</a>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.rateCard && (
                        <div>
                          <div className="text-sm font-medium mb-3">Rate Card</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(parseJson<Record<string, string>>(profile.rateCard) || {}).filter(([,v]) => v && String(v).trim() !== '').map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between border rounded p-3 bg-muted/30">
                                <span className="text-sm capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                <span className="text-sm font-semibold">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.availability && (
                        <div>
                          <div className="text-sm font-medium mb-3">Availability</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(parseJson<Record<string, { start: string; end: string; available: boolean }>>(profile.availability) || {}).map(([day, info]) => (
                              <div key={day} className={`border rounded p-3 ${info?.available ? 'bg-green-50 border-green-200' : 'bg-muted/20'}`}>
                                <div className="text-xs uppercase text-muted-foreground mb-1">{day}</div>
                                {info?.available ? (
                                  <div className="text-sm font-medium">{info.start || '--:--'} – {info.end || '--:--'}</div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">Unavailable</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.verificationBadges && (
                        <div>
                          <div className="text-sm font-medium mb-3">Verification Badges</div>
                          <div className="flex flex-wrap gap-2">
                            {(parseJson<string[]>(profile.verificationBadges) || []).map((b, idx) => (
                              <Badge key={idx} variant="secondary">{b}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}
