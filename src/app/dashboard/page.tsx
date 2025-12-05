"use client";

import { PlatformLayout } from "@/components/platform/platform-layout";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Edit3,
  Shield,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Debug session data
  console.log('Dashboard session:', session);
  console.log('Session user:', session?.user);
  console.log('User type:', (session?.user as any)?.userType);
  console.log('User name:', (session?.user as any)?.name);
  
  const userType = (session?.user as any)?.userType;
  const userName = (session?.user as any)?.name || "User";

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.user) {
        console.log('No session user, skipping stats fetch');
        return;
      }
      
      console.log('Fetching dashboard stats for user:', session.user);
      
      try {
        const response = await fetch('/api/dashboard/stats', {
          credentials: 'include',
        });
        
        console.log('Stats API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Stats API response data:', data);
          setStats(data);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch dashboard stats:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [session]);
  
  // Show loading state
  if (isPending || loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }
  
  // Show error if no session
  if (!session?.user) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">No Session Found</h2>
            <p className="text-muted-foreground mb-4">Please sign in to access the dashboard.</p>
            <a href="/login" className="text-primary hover:underline">Go to Login</a>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  const metrics = userType === "admin"
    ? [
        { label: "Pending Claims", value: stats?.pendingClaims?.toString() || "0", icon: Clock, color: "text-yellow-500" },
        { label: "Total Users", value: stats?.totalUsers?.toString() || "0", icon: Users, color: "text-blue-500" },
        { label: "Approved Claims", value: stats?.approvedClaims?.toString() || "0", icon: CheckCircle, color: "text-green-500" },
        { label: "Rejected Claims", value: stats?.rejectedClaims?.toString() || "0", icon: AlertTriangle, color: "text-red-500" },
      ]
    : userType === "brand" 
    ? [
        { label: "Active Campaigns", value: stats?.activeCampaigns?.toString() || "0", icon: Sparkles, color: "text-purple-500" },
        { label: "Influencers Connected", value: stats?.influencersConnected?.toString() || "0", icon: Users, color: "text-blue-500" },
        { label: "Messages", value: stats?.messagesCount?.toString() || "0", icon: MessageSquare, color: "text-green-500" },
        { label: "Total ROI", value: `$${stats?.totalROI || "0"}`, icon: TrendingUp, color: "text-orange-500" },
      ]
    : [
        { label: "Active Campaigns", value: stats?.activeCampaigns?.toString() || "0", icon: Sparkles, color: "text-purple-500" },
        { label: "Profile Completeness", value: `${stats?.profileCompleteness || "0"}%`, icon: Edit3, color: "text-blue-500" },
        { label: "Notifications", value: stats?.notificationsCount?.toString() || "0", icon: MessageSquare, color: "text-yellow-500" },
        { label: "Messages", value: stats?.messagesCount?.toString() || "0", icon: MessageSquare, color: "text-green-500" },
      ];

  const quickActions = userType === "admin"
    ? [
        {
          title: "Profile Claims",
          description: "Review and manage profile claim requests",
          href: "/admin/claims",
          icon: FileText,
          gradient: "from-yellow-500 to-orange-500",
        },
        {
          title: "User Management",
          description: "Manage users and permissions",
          href: "/admin/users",
          icon: Users,
          gradient: "from-blue-500 to-cyan-500",
        },
        {
          title: "System Analytics",
          description: "View platform statistics and metrics",
          href: "/admin/analytics",
          icon: BarChart3,
          gradient: "from-purple-500 to-pink-500",
        },
        {
          title: "Admin Settings",
          description: "Configure platform settings",
          href: "/admin/settings",
          icon: Shield,
          gradient: "from-green-500 to-emerald-500",
        },
      ]
    : userType === "brand"
    ? [
        {
          title: "My Campaigns",
          description: "View and manage your campaigns",
          href: "/dashboard/campaigns",
          icon: Sparkles,
          gradient: "from-purple-500 to-pink-500",
        },
        {
          title: "Create Campaign",
          description: "Create a campaign and get AI-powered influencer recommendations",
          href: "/dashboard/campaigns/create",
          icon: Sparkles,
          gradient: "from-blue-500 to-cyan-500",
        },
        {
          title: "Product Recommendations",
          description: "Get influencer recommendations based on your product",
          href: "/dashboard/products/recommend",
          icon: Sparkles,
          gradient: "from-green-500 to-emerald-500",
        },
        {
          title: "Find Influencers",
          description: "Browse and connect with influencers",
          href: "/dashboard/browse-influencers",
          icon: Users,
          gradient: "from-orange-500 to-red-500",
        },
        {
          title: "Generate Ad",
          description: "Create AI-powered marketing content",
          href: "/ads",
          icon: Sparkles,
          gradient: "from-indigo-500 to-purple-500",
        },
      ]
    : [
        {
          title: "Browse Active Campaigns",
          description: "Discover active campaigns from brands",
          href: "/dashboard/campaigns/browse",
          icon: Sparkles,
          gradient: "from-purple-500 to-pink-500",
        },
        {
          title: "My Campaigns",
          description: "View campaigns you're part of",
          href: "/dashboard/campaigns",
          icon: Sparkles,
          gradient: "from-blue-500 to-cyan-500",
        },
        {
          title: "Browse Brands",
          description: "Discover partnership opportunities",
          href: "/dashboard/browse-brands",
          icon: Users,
          gradient: "from-green-500 to-emerald-500",
        },
        {
          title: "Edit Profile",
          description: "Update your profile information",
          href: "/dashboard/profile/edit",
          icon: Edit3,
          gradient: "from-orange-500 to-red-500",
        },
        {
          title: "Messages",
          description: "Connect with brands",
          href: "/messages",
          icon: MessageSquare,
          gradient: "from-indigo-500 to-purple-500",
        },
      ];

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-sm lg:text-lg text-muted-foreground">
            {userType === "admin"
              ? "Manage the platform, review claims, and oversee operations"
              : userType === "brand"
              ? "Manage your campaigns and discover new influencers"
              : "Explore brand partnerships and grow your influence"}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6"
        >
          {metrics.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-card rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl bg-muted ${stat.color}`}>
                    <Icon className="w-4 h-4 lg:w-6 lg:h-6" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs lg:text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3 lg:space-y-4"
        >
          <h2 className="text-xl lg:text-2xl font-bold">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link href={action.href} key={action.title}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-card rounded-xl lg:rounded-2xl p-5 lg:p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl cursor-pointer group relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    <div className={`inline-flex p-2.5 lg:p-3 rounded-lg lg:rounded-xl bg-gradient-to-br ${action.gradient} mb-3 lg:mb-4`}>
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold mb-1 lg:mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    <ArrowUpRight className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground absolute top-5 right-5 lg:top-6 lg:right-6 group-hover:text-primary transition-colors" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Upgrade Banner (for free tier) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-primary via-accent to-primary rounded-xl lg:rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 lg:space-y-2">
              <h3 className="text-xl lg:text-2xl font-bold">Unlock Premium Features</h3>
              <p className="text-sm lg:text-base text-white/90">
                {userType === "admin"
                  ? "Access advanced admin tools, detailed analytics, and system management features"
                  : userType === "brand"
                  ? "Get unlimited ad generation, advanced analytics, and priority support"
                  : "Connect with unlimited brands and access exclusive campaigns"}
              </p>
            </div>
            <Link href="/billing">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-semibold w-full sm:w-auto"
              >
                Upgrade Now
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Getting Started (for new users) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-card rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-border"
        >
          <h3 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Getting Started</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 lg:gap-4">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-semibold text-sm lg:text-base">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm lg:text-base">Complete Your Profile</h4>
                <p className="text-muted-foreground text-xs lg:text-sm">
                  Add your information to make the most of the platform
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 lg:gap-4">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-semibold text-sm lg:text-base">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm lg:text-base">
                  {userType === "admin" 
                    ? "Review Profile Claims" 
                    : userType === "brand" 
                    ? "Browse Influencers" 
                    : "Browse Brands"}
                </h4>
                <p className="text-muted-foreground text-xs lg:text-sm">
                  {userType === "admin"
                    ? "Review and approve influencer profile claim requests"
                    : userType === "brand"
                    ? "Find the perfect influencers for your campaigns"
                    : "Discover brands looking for partnerships"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 lg:gap-4">
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-semibold text-sm lg:text-base">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1 text-sm lg:text-base">
                  {userType === "admin" ? "Monitor System Health" : "Start Collaborating"}
                </h4>
                <p className="text-muted-foreground text-xs lg:text-sm">
                  {userType === "admin"
                    ? "Monitor platform performance and user activity"
                    : "Send messages and begin your partnership journey"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}