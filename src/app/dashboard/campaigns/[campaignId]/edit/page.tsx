"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Save } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

const categories = [
  "Fashion", "Beauty", "Education", "Pets", "Technology", "Automotive", "Gaming", 
  "Lifestyle", "Fitness", "Food", "Travel", "Music", "Parenting", "Comedy", 
  "DIY", "Home Decor", "Business", "Photography", "Art", "Entertainment", "Sports", "Other"
];

const platforms = ["Instagram", "YouTube", "TikTok", "Facebook"];

export default function EditCampaignPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.campaignId as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    objectives: [] as string[],
    targetAudience: {
      ageRange: "",
      gender: "",
      interests: [] as string[],
      location: "",
    },
    budget: "",
    budgetRange: { min: "", max: "" },
    startDate: "",
    endDate: "",
    requiredPlatforms: [] as string[],
    contentRequirements: [] as string[],
    geographicTarget: [] as string[],
    minFollowers: "",
    maxFollowers: "",
    minEngagementRate: "",
    status: "draft",
  });

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

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
        const campaign = data.campaign;
        
        // Parse JSON fields
        const safeParse = (str: any, fallback: any) => {
          if (!str) return fallback;
          try { return typeof str === 'string' ? JSON.parse(str) : str; } catch { return fallback; }
        };

        const parsedObjectives = safeParse(campaign.objectives, []);
        const parsedTargetAudience = safeParse(campaign.targetAudience, { ageRange: "", gender: "", interests: [], location: "" });
        const parsedBudgetRange = safeParse(campaign.budgetRange, { min: "", max: "" });
        const parsedRequiredPlatforms = safeParse(campaign.requiredPlatforms, []);
        const parsedContentReqs = safeParse(campaign.contentRequirements, []);
        const parsedGeoTarget = safeParse(campaign.geographicTarget, []);

        setFormData({
          title: campaign.title || "",
          description: campaign.description || "",
          category: campaign.category || "",
          objectives: parsedObjectives,
          targetAudience: parsedTargetAudience,
          budget: campaign.budget || "",
          budgetRange: parsedBudgetRange,
          startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : "",
          endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : "",
          requiredPlatforms: parsedRequiredPlatforms,
          contentRequirements: parsedContentReqs,
          geographicTarget: parsedGeoTarget,
          minFollowers: campaign.minFollowers ? campaign.minFollowers.toString() : "",
          maxFollowers: campaign.maxFollowers ? campaign.maxFollowers.toString() : "",
          minEngagementRate: campaign.minEngagementRate ? campaign.minEngagementRate.toString() : "",
          status: campaign.status || "draft",
        });
      } else {
        toast.error("Campaign not found or you don't have permission to edit it");
        router.push("/dashboard/campaigns");
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign data");
    } finally {
      setIsFetching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (name: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[name as keyof typeof prev] as string[];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);
      return { ...prev, [name]: newArray };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("bearer_token");

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          budgetRange: formData.budgetRange.min || formData.budgetRange.max
            ? {
              min: formData.budgetRange.min ? parseFloat(formData.budgetRange.min) : undefined,
              max: formData.budgetRange.max ? parseFloat(formData.budgetRange.max) : undefined,
            }
            : undefined,
          minFollowers: formData.minFollowers ? parseInt(formData.minFollowers) : undefined,
          maxFollowers: formData.maxFollowers ? parseInt(formData.maxFollowers) : undefined,
          minEngagementRate: formData.minEngagementRate ? parseFloat(formData.minEngagementRate) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Campaign updated successfully!");
        router.push(`/dashboard/campaigns/${campaignId}`);
      } else {
        toast.error(data.error || "Failed to update campaign");
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Failed to update campaign");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/campaigns">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Edit Campaign</h1>
          <p className="text-muted-foreground">
            Update your campaign details and requirements.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Summer Fashion Collection 2024"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Describe your campaign goals, target audience, and what you're looking for..."
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange("category", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Audience & Requirements</CardTitle>
              <CardDescription>Define who you want to reach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minFollowers">Min Followers</Label>
                  <Input
                    id="minFollowers"
                    name="minFollowers"
                    type="number"
                    value={formData.minFollowers}
                    onChange={handleInputChange}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="maxFollowers">Max Followers</Label>
                  <Input
                    id="maxFollowers"
                    name="maxFollowers"
                    type="number"
                    value={formData.maxFollowers}
                    onChange={handleInputChange}
                    placeholder="1000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="minEngagementRate">Min Engagement Rate (%)</Label>
                <Input
                  id="minEngagementRate"
                  name="minEngagementRate"
                  type="number"
                  step="0.1"
                  value={formData.minEngagementRate}
                  onChange={handleInputChange}
                  placeholder="2.5"
                />
              </div>

              <div>
                <Label>Required Platforms</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {platforms.map((platform) => (
                    <label key={platform} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.requiredPlatforms.includes(platform)}
                        onChange={(e) =>
                          handleArrayChange("requiredPlatforms", platform, e.target.checked)
                        }
                        className="rounded"
                      />
                      <span>{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget & Timeline</CardTitle>
              <CardDescription>Set your budget and campaign duration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="budget">Total Budget</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="5000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budgetMin">Budget Range (Min)</Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    value={formData.budgetRange.min}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        budgetRange: { ...prev.budgetRange, min: e.target.value },
                      }))
                    }
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="budgetMax">Budget Range (Max)</Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    value={formData.budgetRange.max}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        budgetRange: { ...prev.budgetRange, max: e.target.value },
                      }))
                    }
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </PlatformLayout>
  );
}
