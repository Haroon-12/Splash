"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Upload,
  Instagram,
  Youtube,
  Facebook,
  MessageSquare,
  Calendar,
  MapPin,
  Star,
  Image as ImageIcon,
  Plus,
  X
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface InfluencerProfile {
  id: string;
  category: string | null;
  instagram: string | null;
  youtube: string | null;
  facebook: string | null;
  tiktok: string | null;
  imageUrl: string | null;
  notes: string | null;
  instagramFollowers: string | null;
  instagramLikes: string | null;
  instagramViews: string | null;
  youtubeFollowers: string | null;
  youtubeLikes: string | null;
  youtubeViews: string | null;
  facebookFollowers: string | null;
  facebookLikes: string | null;
  facebookViews: string | null;
  tiktokFollowers: string | null;
  tiktokLikes: string | null;
  tiktokViews: string | null;
  description: string | null;
  previousBrands: string | null;
  gender: string | null;
  activeHours: string | null;
  images: string | null;
  portfolioSamples: string | null;
  rateCard: string | null;
  availability: string | null;
  preferredBrands: string | null;
  contentPreferences: string | null;
  geographicReach: string | null;
  verificationBadges: string | null;
  lastProfileUpdate: string | null;
  profileCompleteness: number;
}

const categories = [
  "Fashion",
  "Beauty",
  "Education",
  "Pets",
  "Technology",
  "Automotive",
  "Gaming",
  "Lifestyle",
  "Fitness",
  "Food",
  "Travel",
  "Music",
  "Parenting",
  "Comedy",
  "DIY",
  "Home Decor",
  "Business",
  "Photography",
  "Art",
  "Entertainment",
  "Sports",
  "Other"
];

const contentTypes = [
  "Photos",
  "Videos",
  "Reels/Shorts",
  "Stories",
  "Live Streams",
  "Blog Posts",
  "Tutorials",
  "Reviews",
  "Unboxing",
  "Behind the Scenes",
  "Product Showcases",
  "Lifestyle Content"
];

export default function ProfileEditPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [csvData, setCsvData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    instagram: "",
    youtube: "",
    facebook: "",
    tiktok: "",
    imageUrl: "",
    description: "",
    previousBrands: "",
    gender: "",
    activeHours: "",
    notes: "",
    instagramFollowers: "",
    instagramLikes: "",
    instagramViews: "",
    youtubeFollowers: "",
    youtubeLikes: "",
    youtubeViews: "",
    facebookFollowers: "",
    facebookLikes: "",
    facebookViews: "",
    tiktokFollowers: "",
    tiktokLikes: "",
    tiktokViews: "",
    // Extended fields
    preferredBrands: [] as string[],
    contentPreferences: [] as string[],
    geographicReach: [] as string[],
    rateCard: {
      photoPost: "",
      videoPost: "",
      story: "",
      reel: "",
      collaboration: "",
    },
    availability: {
      monday: { start: "", end: "", available: false },
      tuesday: { start: "", end: "", available: false },
      wednesday: { start: "", end: "", available: false },
      thursday: { start: "", end: "", available: false },
      friday: { start: "", end: "", available: false },
      saturday: { start: "", end: "", available: false },
      sunday: { start: "", end: "", available: false },
    },
    portfolioSamples: [] as string[],
    verificationBadges: [] as string[],
  });

  useEffect(() => {
    if (isPending) {
      return; // Still loading session
    }

    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Check user type after session is loaded
    if (session.user.userType !== "influencer") {
      toast.error("Access denied. Only influencers can edit profiles.");
      router.push("/dashboard");
      return;
    }

    // Session is loaded and user is influencer, fetch profile
    fetchProfile();
  }, [session, isPending, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/influencer-profiles/${session?.user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);

        // Populate form data
        if (data.profile) {
          setFormData({
            category: data.profile.category || "",
            instagram: data.profile.instagram || "",
            youtube: data.profile.youtube || "",
            facebook: data.profile.facebook || "",
            tiktok: data.profile.tiktok || "",
            imageUrl: data.profile.imageUrl || "",
            description: data.profile.description || "",
            previousBrands: data.profile.previousBrands || "",
            gender: data.profile.gender || "",
            activeHours: data.profile.activeHours || "",
            instagramFollowers: data.profile.instagramFollowers || "",
            instagramLikes: data.profile.instagramLikes || "",
            instagramViews: data.profile.instagramViews || "",
            youtubeFollowers: data.profile.youtubeFollowers || "",
            youtubeLikes: data.profile.youtubeLikes || "",
            youtubeViews: data.profile.youtubeViews || "",
            facebookFollowers: data.profile.facebookFollowers || "",
            facebookLikes: data.profile.facebookLikes || "",
            facebookViews: data.profile.facebookViews || "",
            tiktokFollowers: data.profile.tiktokFollowers || "",
            tiktokLikes: data.profile.tiktokLikes || "",
            tiktokViews: data.profile.tiktokViews || "",
            preferredBrands: data.profile.preferredBrands ? JSON.parse(data.profile.preferredBrands) : [],
            contentPreferences: data.profile.contentPreferences ? JSON.parse(data.profile.contentPreferences) : [],
            geographicReach: data.profile.geographicReach ? JSON.parse(data.profile.geographicReach) : [],
            rateCard: data.profile.rateCard ? JSON.parse(data.profile.rateCard) : {
              photoPost: "",
              videoPost: "",
              story: "",
              reel: "",
              collaboration: "",
            },
            availability: data.profile.availability ? JSON.parse(data.profile.availability) : {
              monday: { start: "", end: "", available: false },
              tuesday: { start: "", end: "", available: false },
              wednesday: { start: "", end: "", available: false },
              thursday: { start: "", end: "", available: false },
              friday: { start: "", end: "", available: false },
              saturday: { start: "", end: "", available: false },
              sunday: { start: "", end: "", available: false },
            },
            portfolioSamples: data.profile.portfolioSamples ? JSON.parse(data.profile.portfolioSamples) : [],
            verificationBadges: data.profile.verificationBadges ? JSON.parse(data.profile.verificationBadges) : [],
          });
        }
      } else {
        // Profile doesn't exist, create a new one
        await createProfile();
      }

      // Fetch CSV data for this user
      await fetchCSVData(session?.user?.email, session?.user?.name);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchCSVData = async (email: string, name: string) => {
    try {
      // Try multiple search strategies for better matching
      const searchParams = new URLSearchParams();
      if (email) searchParams.set('email', email);
      if (name) searchParams.set('name', name);

      const response = await fetch(`/api/csv-data?${searchParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setCsvData(data);

        // Merge CSV data with form data, prioritizing existing profile data
        setFormData(prev => ({
          ...prev,
          // Use CSV data as defaults if profile data is empty
          category: prev.category || data.category || "",
          instagram: prev.instagram || data.instagram || "",
          youtube: prev.youtube || data.youtube || "",
          facebook: prev.facebook || data.facebook || "",
          tiktok: prev.tiktok || data.tiktok || "",
          imageUrl: prev.imageUrl || data.imageUrl || "",
          description: prev.description || data.description || "",
          previousBrands: prev.previousBrands || data.previousBrands || "",
          gender: prev.gender || data.gender || "",
          activeHours: prev.activeHours || data.activeHours || "",
          notes: prev.notes || data.notes || "",
          // Social media metrics
          instagramFollowers: prev.instagramFollowers || data.instagramFollowers || "",
          instagramLikes: prev.instagramLikes || data.instagramLikes || "",
          instagramViews: prev.instagramViews || data.instagramViews || "",
          youtubeFollowers: prev.youtubeFollowers || data.youtubeFollowers || "",
          youtubeLikes: prev.youtubeLikes || data.youtubeLikes || "",
          youtubeViews: prev.youtubeViews || data.youtubeViews || "",
          facebookFollowers: prev.facebookFollowers || data.facebookFollowers || "",
          facebookLikes: prev.facebookLikes || data.facebookLikes || "",
          facebookViews: prev.facebookViews || data.facebookViews || "",
          tiktokFollowers: prev.tiktokFollowers || data.tiktokFollowers || "",
          tiktokLikes: prev.tiktokLikes || data.tiktokLikes || "",
          tiktokViews: prev.tiktokViews || data.tiktokViews || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching CSV data:", error);
      // Don't show error to user, just continue without CSV data
    }
  };

  const createProfile = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/influencer-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: session?.user?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name: string, value: string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      // Create a preview URL for the image
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, imageUrl }));
    }
  };

  const handleRateCardChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      rateCard: { ...prev.rateCard, [field]: value }
    }));
  };

  const handleAvailabilityChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: { ...prev.availability[day as keyof typeof prev.availability], [field]: value }
      }
    }));
  };

  const calculateProfileCompleteness = () => {
    const fields = [
      formData.category,
      formData.description,
      formData.instagram,
      formData.youtube,
      formData.facebook,
      formData.tiktok,
      formData.previousBrands,
      formData.gender,
      formData.activeHours,
    ];

    const filledFields = fields.filter(field => field && field.trim() !== "").length;
    const socialMetrics = [
      formData.instagramFollowers,
      formData.youtubeFollowers,
      formData.facebookFollowers,
      formData.tiktokFollowers,
    ].filter(field => field && field.trim() !== "").length;

    const totalFields = fields.length + 4; // Include social metrics
    const completedFields = filledFields + socialMetrics;

    return Math.round((completedFields / totalFields) * 100);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("bearer_token");

      const profileData = {
        ...formData,
        profileCompleteness: calculateProfileCompleteness(),
        lastProfileUpdate: new Date().toISOString(),
        preferredBrands: JSON.stringify(formData.preferredBrands),
        contentPreferences: JSON.stringify(formData.contentPreferences),
        geographicReach: JSON.stringify(formData.geographicReach),
        rateCard: JSON.stringify(formData.rateCard),
        availability: JSON.stringify(formData.availability),
        portfolioSamples: JSON.stringify(formData.portfolioSamples),
        verificationBadges: JSON.stringify(formData.verificationBadges),
      };

      const response = await fetch(`/api/influencer-profiles/${session?.user?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
        await fetchProfile(); // Refresh profile data
      } else {
        const errorData = await response.json();
        console.error("Profile update error:", errorData);
        throw new Error(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
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

  if (!session?.user || session.user.userType !== "influencer") {
    return null;
  }

  const completeness = calculateProfileCompleteness();

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">Edit Profile</h1>
              <p className="text-sm lg:text-base text-muted-foreground">
                Complete your influencer profile to attract more brand collaborations
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Profile Completeness</div>
              <div className="text-2xl font-bold text-primary">{completeness}%</div>
              <div className="w-24 h-2 bg-muted rounded-full mt-1">
                <div
                  className="h-2 bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Tell brands about yourself and your content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Picture Upload */}
                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Profile Picture</Label>
                  <div className="flex items-center space-x-4">
                    {formData.imageUrl && (
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                        <img
                          src={formData.imageUrl}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        id="profilePicture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload a profile picture that will be visible in browse and profile view
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleSelectChange("gender", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Bio/Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell brands about yourself, your content style, and what makes you unique..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousBrands">Previous Brand Collaborations</Label>
                  <Textarea
                    id="previousBrands"
                    name="previousBrands"
                    placeholder="List brands you've worked with before (optional)"
                    value={formData.previousBrands}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activeHours">Active Hours</Label>
                  <Input
                    id="activeHours"
                    name="activeHours"
                    placeholder="e.g., 9 AM - 6 PM EST"
                    value={formData.activeHours}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional notes or information about your profile..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Social Media Profiles</CardTitle>
                <CardDescription>
                  Add your social media links and metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Instagram */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-pink-500" />
                    <Label className="text-base font-semibold">Instagram</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Profile URL</Label>
                      <Input
                        id="instagram"
                        name="instagram"
                        placeholder="https://instagram.com/yourusername"
                        value={formData.instagram}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagramFollowers">Followers</Label>
                      <Input
                        id="instagramFollowers"
                        name="instagramFollowers"
                        placeholder="e.g., 10K, 50K, 100K"
                        value={formData.instagramFollowers}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagramLikes">Average Likes</Label>
                      <Input
                        id="instagramLikes"
                        name="instagramLikes"
                        placeholder="e.g., 1K, 5K, 10K"
                        value={formData.instagramLikes}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagramViews">Average Views</Label>
                      <Input
                        id="instagramViews"
                        name="instagramViews"
                        placeholder="e.g., 5K, 25K, 100K"
                        value={formData.instagramViews}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* YouTube */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <Label className="text-base font-semibold">YouTube</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="youtube">Channel URL</Label>
                      <Input
                        id="youtube"
                        name="youtube"
                        placeholder="https://youtube.com/@yourchannel"
                        value={formData.youtube}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtubeFollowers">Subscribers</Label>
                      <Input
                        id="youtubeFollowers"
                        name="youtubeFollowers"
                        placeholder="e.g., 5K, 25K, 100K"
                        value={formData.youtubeFollowers}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="youtubeLikes">Average Likes</Label>
                      <Input
                        id="youtubeLikes"
                        name="youtubeLikes"
                        placeholder="e.g., 5K, 10K, 50K"
                        value={formData.youtubeLikes}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="youtubeViews">Total Views</Label>
                      <Input
                        id="youtubeViews"
                        name="youtubeViews"
                        placeholder="e.g., 1M, 10M, 100M"
                        value={formData.youtubeViews}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Facebook */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <Label className="text-base font-semibold">Facebook</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook">Page URL</Label>
                      <Input
                        id="facebook"
                        name="facebook"
                        placeholder="https://facebook.com/yourpage"
                        value={formData.facebook}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebookFollowers">Followers</Label>
                      <Input
                        id="facebookFollowers"
                        name="facebookFollowers"
                        placeholder="e.g., 2K, 10K, 50K"
                        value={formData.facebookFollowers}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebookLikes">Average Likes</Label>
                      <Input
                        id="facebookLikes"
                        name="facebookLikes"
                        placeholder="e.g., 500, 2K, 10K"
                        value={formData.facebookLikes}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facebookViews">Total Views</Label>
                      <Input
                        id="facebookViews"
                        name="facebookViews"
                        placeholder="e.g., 1M, 10M"
                        value={formData.facebookViews}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* TikTok */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-black text-white rounded flex items-center justify-center text-xs font-bold">
                      TT
                    </div>
                    <Label className="text-base font-semibold">TikTok</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tiktok">Profile URL</Label>
                      <Input
                        id="tiktok"
                        name="tiktok"
                        placeholder="https://tiktok.com/@yourusername"
                        value={formData.tiktok}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktokFollowers">Followers</Label>
                      <Input
                        id="tiktokFollowers"
                        name="tiktokFollowers"
                        placeholder="e.g., 5K, 20K, 100K"
                        value={formData.tiktokFollowers}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tiktokLikes">Average Likes</Label>
                      <Input
                        id="tiktokLikes"
                        name="tiktokLikes"
                        placeholder="e.g., 10K, 100K, 1M"
                        value={formData.tiktokLikes}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktokViews">Total Views</Label>
                      <Input
                        id="tiktokViews"
                        name="tiktokViews"
                        placeholder="e.g., 10M, 100M"
                        value={formData.tiktokViews}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Preferences</CardTitle>
                <CardDescription>
                  Specify what types of brands and content you prefer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Content Types You Create</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {contentTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={type}
                            checked={formData.contentPreferences.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleArrayChange("contentPreferences", [...formData.contentPreferences, type]);
                              } else {
                                handleArrayChange("contentPreferences", formData.contentPreferences.filter(t => t !== type));
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={type} className="text-sm">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Card</CardTitle>
                <CardDescription>
                  Set your pricing for different types of content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="photoPost">Photo Post</Label>
                    <Input
                      id="photoPost"
                      placeholder="e.g., $500"
                      value={formData.rateCard.photoPost}
                      onChange={(e) => handleRateCardChange("photoPost", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoPost">Video Post</Label>
                    <Input
                      id="videoPost"
                      placeholder="e.g., $800"
                      value={formData.rateCard.videoPost}
                      onChange={(e) => handleRateCardChange("videoPost", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="story">Story</Label>
                    <Input
                      id="story"
                      placeholder="e.g., $200"
                      value={formData.rateCard.story}
                      onChange={(e) => handleRateCardChange("story", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reel">Reel/Short</Label>
                    <Input
                      id="reel"
                      placeholder="e.g., $600"
                      value={formData.rateCard.reel}
                      onChange={(e) => handleRateCardChange("reel", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">


            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
                <CardDescription>
                  Set your availability for brand collaborations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(formData.availability).map(([day, schedule]) => (
                  <div key={day} className="flex items-center space-x-4">
                    <div className="w-20">
                      <Label className="capitalize">{day}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={schedule.available}
                        onChange={(e) => handleAvailabilityChange(day, "available", e.target.checked)}
                        className="rounded"
                      />
                      <Label>Available</Label>
                    </div>
                    {schedule.available && (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={schedule.start}
                          onChange={(e) => handleAvailabilityChange(day, "start", e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={schedule.end}
                          onChange={(e) => handleAvailabilityChange(day, "end", e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </PlatformLayout>
  );
}
