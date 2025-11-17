"use client";

import { PlatformLayout } from "@/components/platform/platform-layout";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  BarChart3,
  Target,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userType = (session?.user as any)?.userType;
  const [timeRange, setTimeRange] = useState("30days");

  // Redirect influencers away from this page
  if (userType !== "brand") {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Brand Feature Only</h2>
            <p className="text-muted-foreground">
              Analytics and ROI tracking is only available for brand accounts.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  const stats = [
    {
      label: "Total Revenue",
      value: "$0",
      change: "+0%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-500",
    },
    {
      label: "Campaign ROI",
      value: "0%",
      change: "+0%",
      trend: "up",
      icon: TrendingUp,
      color: "text-blue-500",
    },
    {
      label: "Total Impressions",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: Eye,
      color: "text-purple-500",
    },
    {
      label: "Conversions",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: Target,
      color: "text-orange-500",
    },
  ];

  const campaigns = [
    {
      id: 1,
      name: "Summer Collection Launch",
      influencer: "Sarah Johnson",
      status: "active",
      impressions: "0",
      clicks: 0,
      conversions: 0,
      revenue: "$0",
      roi: "0%",
    },
  ];

  const affiliateLinks = [
    {
      id: 1,
      influencer: "Sarah Johnson",
      link: "splash.co/sarah-summer",
      clicks: 0,
      conversions: 0,
      revenue: "$0",
    },
  ];

  return (
    <PlatformLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">Analytics & ROI</h1>
            <p className="text-muted-foreground text-lg">
              Track your campaign performance and revenue
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === "up" ? ArrowUp : ArrowDown;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div
                    className={`flex items-center gap-1 text-sm font-semibold ${
                      stat.trend === "up" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    <TrendIcon className="w-4 h-4" />
                    {stat.change}
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Active Campaigns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Active Campaigns</h2>
            <Button variant="outline">View All</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-semibold">Campaign</th>
                  <th className="pb-3 font-semibold">Influencer</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Impressions</th>
                  <th className="pb-3 font-semibold">Conversions</th>
                  <th className="pb-3 font-semibold">Revenue</th>
                  <th className="pb-3 font-semibold">ROI</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length > 0 ? (
                  campaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-border">
                      <td className="py-4 font-medium">{campaign.name}</td>
                      <td className="py-4">{campaign.influencer}</td>
                      <td className="py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500">
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-4">{campaign.impressions}</td>
                      <td className="py-4">{campaign.conversions}</td>
                      <td className="py-4 font-semibold">{campaign.revenue}</td>
                      <td className="py-4">
                        <span className="text-green-500 font-semibold">
                          {campaign.roi}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No active campaigns yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Affiliate Links Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Affiliate Link Performance</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Track sales from each influencer
              </p>
            </div>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Create Link
            </Button>
          </div>

          <div className="space-y-4">
            {affiliateLinks.length > 0 ? (
              affiliateLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-4 rounded-xl border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold mb-1">{link.influencer}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-3 py-1 rounded">
                          {link.link}
                        </code>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-500">
                        {link.revenue}
                      </p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Clicks</p>
                      <p className="text-lg font-semibold">{link.clicks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversions</p>
                      <p className="text-lg font-semibold">{link.conversions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conv. Rate</p>
                      <p className="text-lg font-semibold">
                        {link.clicks > 0
                          ? ((link.conversions / link.clicks) * 100).toFixed(1)
                          : 0}
                        %
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No affiliate links created yet
              </div>
            )}
          </div>
        </motion.div>

        {/* Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h2 className="text-2xl font-bold mb-6">Revenue Over Time</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">
              Chart will be displayed here (integrate Chart.js or Recharts)
            </p>
          </div>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}