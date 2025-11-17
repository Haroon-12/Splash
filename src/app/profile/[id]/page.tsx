"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Shield, MessageSquare, ArrowLeft, Instagram, Youtube, Facebook, Video } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  userType: string;
  isApproved: boolean;
  createdAt: string;
  approvedAt: string | null;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
      return;
    }

    if (session?.user && params.id) {
      fetchUser();
    }
  }, [session, isPending, params.id, router]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/users/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user profile");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (!session?.user?.id || !user) return;

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
            c.participant1Id === user.id || c.participant2Id === user.id
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
          participant2Id: user.id,
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

  if (!session?.user || !user) {
    return null;
  }

  const isOwnProfile = session.user.id === user.id;
  const isBrand = (session.user as any).userType === "brand";
  const isAdmin = (session.user as any).userType === "admin";

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20 lg:h-24 lg:w-24">
                <AvatarImage
                  src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                />
                <AvatarFallback className="text-2xl">
                  {user.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <CardTitle className="text-2xl lg:text-3xl">{user.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant={user.userType === "admin" ? "default" : "secondary"} className="capitalize">
                      {user.userType === "admin" ? "👑 Admin" : user.userType}
                    </Badge>
                    {user.isApproved && (
                      <Badge variant="outline" className="text-green-600">
                        ✓ Approved
                      </Badge>
                    )}
                    {!user.isApproved && (
                      <Badge variant="outline" className="text-yellow-600">
                        ⏳ Pending Approval
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {!isOwnProfile && (isBrand || isAdmin) && user.userType !== "admin" && (
                <Button onClick={handleStartConversation}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-5 h-5" />
                <span>{user.email}</span>
              </div>

              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-5 h-5" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}</span>
              </div>

              {user.isApproved && user.approvedAt && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Shield className="w-5 h-5" />
                  <span>Approved on {new Date(user.approvedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}</span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            {isOwnProfile && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  This is your profile. Other users can view this information when they browse the platform.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}