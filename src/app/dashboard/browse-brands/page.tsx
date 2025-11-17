"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Search, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

interface Brand {
  id: string;
  name: string;
  email: string;
  image: string | null;
  userType: string;
  isApproved: boolean;
  createdAt: string;
}

export default function BrowseBrandsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchBrands();
    }
  }, [session, isPending, router]);

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/users/brands", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch brands");
      }

      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async (brandId: string) => {
    if (!session?.user?.id) return;

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
            c.participant1Id === brandId || c.participant2Id === brandId
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
          participant2Id: brandId,
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

  const isInfluencer = session.user.userType === "influencer";

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {isInfluencer ? "Browse Brands" : "Explore Network"}
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            {isInfluencer
              ? "Find brands to collaborate with and grow your partnerships"
              : "Connect with other brands and explore collaboration opportunities"}
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

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredBrands.map((brand, index) => (
            <motion.div
              key={brand.id}
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
                      src={brand.image || `https://api.dicebear.com/7.x/initials/svg?seed=${brand.name}`} 
                      alt={brand.name} 
                    />
                    <AvatarFallback>{brand.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{brand.name}</h3>
                    <div className="text-sm text-muted-foreground">
                      {brand.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {brand.isApproved && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="text-xs lg:text-sm text-muted-foreground mb-4">
                Joined {new Date(brand.createdAt).toLocaleDateString()}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => router.push(`/profile/${brand.id}`)}
                >
                  View Profile
                </Button>
                {isInfluencer && (
                  <Button
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    onClick={() => handleStartConversation(brand.id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredBrands.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery 
                ? "No brands found matching your search." 
                : "No verified brands yet."}
            </p>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
}