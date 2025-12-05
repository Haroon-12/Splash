"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Search, Sparkles, Calendar, DollarSign, ArrowRight, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { matchesSearch } from "@/lib/search-utils";

interface Campaign {
  id: number;
  brandId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  createdAt: string;
  updatedAt: string;
  brand?: {
    name: string;
    email: string;
  };
}

export default function BrowseActiveCampaignsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
      return;
    }

    if (session?.user && (session.user as any).userType === "influencer") {
      fetchActiveCampaigns();
    }
  }, [session, isPending, router]);

  const fetchActiveCampaigns = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bearer_token");
      
      // Fetch all active campaigns
      const response = await fetch("/api/campaigns/active", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } else {
        console.error("Failed to fetch active campaigns:", response.status);
        toast.error("Failed to load campaigns");
      }
    } catch (error) {
      console.error("Error fetching active campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter campaigns by search and category
  const trimmedSearchQuery = searchQuery.trim();
  const filteredCampaigns = campaigns
    .filter((campaign) => {
      // Search filter - check title, description, category
      if (trimmedSearchQuery) {
        const titleMatch = matchesSearch(campaign.title, trimmedSearchQuery);
        const descriptionMatch = matchesSearch(campaign.description, trimmedSearchQuery);
        const categoryMatch = matchesSearch(campaign.category, trimmedSearchQuery);
        
        if (!titleMatch && !descriptionMatch && !categoryMatch) {
          return false;
        }
      }
      
      // Category filter
      if (categoryFilter !== "all" && campaign.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Get unique categories for filter
  const categories = Array.from(new Set(campaigns.map(c => c.category).filter(Boolean)));

  if (isPending || isLoading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!session?.user || (session.user as any).userType !== "influencer") {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Browse Active Campaigns
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Discover active campaigns from brands looking for influencers
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search campaigns by title, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                onClick={() => setCategoryFilter("all")}
              >
                All Categories
              </Button>
              {categories.slice(0, 3).map((category) => (
                <Button
                  key={category}
                  variant={categoryFilter === category ? "default" : "outline"}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== "all"
                ? "No active campaigns found matching your filters."
                : "No active campaigns available at the moment."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg lg:text-xl line-clamp-2">
                        {campaign.title}
                      </CardTitle>
                      <Badge className="bg-green-500 text-white">
                        Active
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {campaign.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4" />
                      <span>{campaign.category}</span>
                    </div>
                    {campaign.budget && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>{campaign.budget}</span>
                      </div>
                    )}
                    {campaign.startDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(campaign.startDate)}
                          {campaign.endDate && ` - ${formatDate(campaign.endDate)}`}
                        </span>
                      </div>
                    )}
                    {campaign.brand && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Brand:</span> {campaign.brand.name}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link href={`/dashboard/campaigns/${campaign.id}`} className="w-full">
                      <Button variant="outline" className="w-full">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}

