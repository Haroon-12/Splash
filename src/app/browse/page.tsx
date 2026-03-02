"use client";

import { PlatformLayout } from "@/components/platform/platform-layout";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  MapPin,
  Users,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  MessageSquare,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function BrowsePage() {
  const { data: session } = useSession();
  const userType = (session?.user as any)?.userType;
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Placeholder data - will be replaced with CSV import
  const placeholderData = [
    {
      id: 1,
      name: "Sarah Johnson",
      category: "Fashion & Lifestyle",
      location: "New York, USA",
      followers: "250K",
      engagement: "4.5%",
      rating: 4.8,
      platforms: ["instagram", "tiktok", "youtube"],
      bio: "Fashion influencer & content creator",
      hasAccount: true,
    },
    {
      id: 2,
      name: "Tech Brand Inc",
      category: "Technology",
      location: "San Francisco, USA",
      budget: "$5K - $10K",
      rating: 4.9,
      campaigns: 12,
      platforms: ["website", "instagram", "twitter"],
      bio: "Leading tech company seeking partnerships",
      hasAccount: true,
    },
    {
      id: 3,
      name: "Mike Chen",
      category: "Food & Travel",
      location: "Los Angeles, USA",
      followers: "180K",
      engagement: "5.2%",
      rating: 4.7,
      platforms: ["instagram", "youtube"],
      bio: "Food blogger & travel enthusiast",
      hasAccount: false,
    },
  ];

  const categories = [
    "All Categories",
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

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="w-4 h-4" />;
      case "twitter":
        return <Twitter className="w-4 h-4" />;
      case "facebook":
        return <Facebook className="w-4 h-4" />;
      case "youtube":
        return <Youtube className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <PlatformLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2">
            {userType === "brand" ? "Browse Influencers" : "Browse Brands"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {userType === "brand"
              ? "Discover and connect with influencers for your campaigns"
              : "Find brands looking for partnerships"}
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-2xl border border-border"
        >
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={
                userType === "brand"
                  ? "Search influencers by name, category..."
                  : "Search brands by name, industry..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-12">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem
                  key={category}
                  value={category.toLowerCase().replace(/ /g, "-")}
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <p className="text-muted-foreground">
            Showing <span className="font-semibold text-foreground">3</span>{" "}
            results
          </p>
          <p className="text-sm text-muted-foreground">
            📊 Full database will be imported from CSV
          </p>
        </motion.div>

        {/* Results Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {placeholderData.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
            >
              {/* Profile Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {item.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold">{item.rating}</span>
                </div>
              </div>

              {/* Category Badge */}
              <Badge variant="secondary" className="mb-3">
                {item.category}
              </Badge>

              {/* Bio */}
              <p className="text-sm text-muted-foreground mb-4">{item.bio}</p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-muted rounded-xl">
                {userType === "brand" ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Followers</p>
                      <p className="font-semibold">{item.followers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Engagement</p>
                      <p className="font-semibold">{item.engagement}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-semibold">{item.budget}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Campaigns</p>
                      <p className="font-semibold">{item.campaigns}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Social Platforms */}
              <div className="flex items-center gap-2 mb-4">
                {item.platforms.map((platform) => (
                  <div
                    key={platform}
                    className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                  >
                    {getPlatformIcon(platform)}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  View Profile
                </Button>
                {item.hasAccount ? (
                  <Button className="flex-1 bg-gradient-to-r from-primary to-accent">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                ) : (
                  <Button variant="secondary" className="flex-1" disabled>
                    No Account
                  </Button>
                )}
              </div>

              {/* Account Status Badge */}
              {!item.hasAccount && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  This {userType === "brand" ? "influencer" : "brand"} hasn't
                  joined yet
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-muted/50 rounded-2xl p-8 text-center border-2 border-dashed border-border"
        >
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">
            More {userType === "brand" ? "Influencers" : "Brands"} Coming Soon
          </h3>
          <p className="text-muted-foreground">
            The full database will be imported from your CSV file. These are
            just placeholder examples.
          </p>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}