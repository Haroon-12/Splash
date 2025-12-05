"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";

const categories = [
  "Fashion & Lifestyle",
  "Travel & Adventure",
  "Food & Cooking",
  "Technology",
  "Fitness & Health",
  "Beauty & Skincare",
  "Gaming",
  "Education",
  "Business & Finance",
  "Entertainment",
  "Sports",
  "Music",
  "Art & Design",
  "Home & Decor",
  "Pet Care",
  "Other",
];

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
}

export default function ProductRecommendationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // Restore recommendations state when returning from profile page
  useEffect(() => {
    const savedRecommendations = sessionStorage.getItem('productRecommendations');
    const savedFormData = sessionStorage.getItem('productFormData');
    const shouldShowRecommendations = searchParams.get('showRecommendations') === 'true';
    
    if (shouldShowRecommendations && savedRecommendations) {
      try {
        const parsedRecommendations = JSON.parse(savedRecommendations);
        setRecommendations(parsedRecommendations);
        setShowRecommendations(true);
      } catch (e) {
        console.error('Error restoring recommendations:', e);
      }
    }
    
    if (savedFormData) {
      try {
        const parsedFormData = JSON.parse(savedFormData);
        setFormData(parsedFormData);
      } catch (e) {
        console.error('Error restoring form data:', e);
      }
    }
  }, [searchParams]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    targetAudience: {
      ageRange: "",
      gender: "",
      interests: [] as string[],
    },
    priceRange: { min: "", max: "" },
    features: [] as string[],
    useCases: [] as string[],
    brandValues: [] as string[],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGetRecommendations = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First create the product
      const token = localStorage.getItem("bearer_token");
      
      const productResponse = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          priceRange: formData.priceRange.min || formData.priceRange.max
            ? {
                min: formData.priceRange.min ? parseFloat(formData.priceRange.min) : undefined,
                max: formData.priceRange.max ? parseFloat(formData.priceRange.max) : undefined,
              }
            : undefined,
        }),
      });

      const productData = await productResponse.json();

      if (!productResponse.ok || !productData.success) {
        throw new Error(productData.error || "Failed to create product");
      }

      // Then get recommendations
      const recResponse = await fetch(`/api/recommendations/product/${productData.product.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const recData = await recResponse.json();

      if (recResponse.ok && recData.success) {
        const recs = recData.recommendations || [];
        setRecommendations(recs);
        setShowRecommendations(true);
        
        // Save recommendations and form data to sessionStorage for navigation persistence
        sessionStorage.setItem('productRecommendations', JSON.stringify(recs));
        sessionStorage.setItem('productFormData', JSON.stringify(formData));
        
        toast.success("Recommendations generated successfully!");
      } else {
        throw new Error(recData.error || "Failed to get recommendations");
      }
    } catch (error: any) {
      console.error("Error getting recommendations:", error);
      toast.error(error.message || "Failed to get recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async (influencerId: string) => {
    if (!session?.user?.id) return;

    try {
      const token = localStorage.getItem("bearer_token");
      
      const response = await fetch("/api/conversations", {
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

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Product-Based Recommendations</h1>
          <p className="text-muted-foreground">
            Share your product details to get AI-powered influencer recommendations
          </p>
        </div>

        {!showRecommendations ? (
          <form onSubmit={handleGetRecommendations} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Tell us about your product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Eco-Friendly Water Bottle"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Product Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder="Describe your product, its features, and benefits..."
                  />
                </div>

                <div>
                  <Label htmlFor="category">Product Category *</Label>
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

                <div>
                  <Label htmlFor="targetGender">Target Gender *</Label>
                  <Select
                    value={formData.targetAudience.gender || "all"}
                    onValueChange={(value) =>
                      setFormData(prev => ({
                        ...prev,
                        targetAudience: { ...prev.targetAudience, gender: value === "all" ? "" : value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Non-binary">Non-binary</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Important: For products like makeup, beauty, or skincare, select the appropriate gender to get better recommendations
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceMin">Price Range (Min)</Label>
                    <Input
                      id="priceMin"
                      type="number"
                      value={formData.priceRange.min}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, min: e.target.value },
                        }))
                      }
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceMax">Price Range (Max)</Label>
                    <Input
                      id="priceMax"
                      type="number"
                      value={formData.priceRange.max}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, max: e.target.value },
                        }))
                      }
                      placeholder="100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isLoading ? "Generating Recommendations..." : "Get Recommendations"}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Recommended Influencers
                </CardTitle>
                <CardDescription>
                  Based on your product: {formData.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No recommendations available. Try adjusting your product details.
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
                          <div className="flex justify-between text-xs" title="Based on the influencer's average engagement rate across all their social media platforms">
                            <span>Engagement Quality:</span>
                            <span>{rec.scoreBreakdown.engagementQuality}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Audience Alignment:</span>
                            <span>{rec.scoreBreakdown.audienceAlignment}%</span>
                          </div>
                          {/* Only show platform match if it's applicable (not -1) */}
                          {rec.scoreBreakdown.platformMatch >= 0 && (
                            <div className="flex justify-between text-xs">
                              <span>Platform Match:</span>
                              <span>{rec.scoreBreakdown.platformMatch}%</span>
                            </div>
                          )}
                        </div>

                        {/* Check if influencer has account */}
                        {(() => {
                          const hasAccount = rec.influencer.profile?.dataSource !== 'csv' && 
                                           rec.influencer.profile?.isPlatformUser !== false &&
                                           !rec.influencerId.startsWith('csv-');
                          
                          return hasAccount ? (
                            <div className="space-y-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  // Pass query parameter to indicate we came from product recommendations
                                  router.push(`/dashboard/profile/${rec.influencerId}?from=product-recommendations`);
                                }}
                              >
                                View Profile
                              </Button>
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
                                  // For CSV influencers, use the influencerId which is already in csv- format
                                  // The profile page will handle parsing it correctly
                                  // Pass query parameter to indicate we came from product recommendations
                                  router.push(`/dashboard/profile/${encodeURIComponent(rec.influencerId)}?from=product-recommendations`);
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

            <Button
              variant="outline"
              onClick={() => {
                setShowRecommendations(false);
                setRecommendations([]);
                // Clear saved data
                sessionStorage.removeItem('productRecommendations');
                sessionStorage.removeItem('productFormData');
              }}
            >
              Try Another Product
            </Button>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}


