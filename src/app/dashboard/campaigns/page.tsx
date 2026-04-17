"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Search, Sparkles, Calendar, DollarSign, Users, ArrowRight, Plus, Filter, Edit } from "lucide-react";
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
}

export default function CampaignsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const userType = (session?.user as any)?.userType;

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchCampaigns();
    }
  }, [session, isPending, router, userType]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bearer_token");
      
      if (userType === "brand") {
        // Fetch brand's own campaigns
        const response = await fetch("/api/campaigns", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCampaigns(data.campaigns || []);
        } else {
          console.error("Failed to fetch campaigns:", response.status);
          toast.error("Failed to load campaigns");
        }
      } else if (userType === "influencer") {
        // Fetch campaigns where influencer is part of collaborations
        const response = await fetch("/api/campaigns/influencer", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCampaigns(data.campaigns || []);
        } else {
          console.error("Failed to fetch campaigns:", response.status);
          toast.error("Failed to load campaigns");
        }
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter campaigns by search and status
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
      
      // Status filter
      if (statusFilter !== "all" && campaign.status !== statusFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by status: active first, then by creation date
      const statusOrder = { active: 0, draft: 1, paused: 2, completed: 3, cancelled: 4 };
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 5;
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 5;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "draft":
        return "bg-gray-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              {userType === "brand" ? "My Campaigns" : "Campaigns"}
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              {userType === "brand"
                ? "Manage and track your marketing campaigns"
                : "View campaigns you're part of"}
            </p>
          </div>
          {userType === "brand" && (
            <Link href="/dashboard/campaigns/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
          )}
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
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "draft" ? "default" : "outline"}
                onClick={() => setStatusFilter("draft")}
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </Button>
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "No campaigns found matching your filters."
                : userType === "brand"
                ? "You haven't created any campaigns yet."
                : "You're not part of any campaigns yet."}
            </p>
            {userType === "brand" && !searchQuery && statusFilter === "all" && (
              <Link href="/dashboard/campaigns/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </Link>
            )}
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
                      <Badge className={`${getStatusColor(campaign.status)} text-white capitalize`}>
                        {campaign.status}
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
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Link href={`/dashboard/campaigns/${campaign.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    {userType === "brand" && campaign.status !== "completed" && campaign.status !== "cancelled" && (
                      <Link href={`/dashboard/campaigns/${campaign.id}/edit`} className="flex-none">
                        <Button variant="outline" className="w-full px-3" title="Edit Campaign">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
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

