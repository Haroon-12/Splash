"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { TrendingUp, DollarSign, Users, Eye, Target, BarChart3, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalyticsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Redirect influencers to dashboard
  useEffect(() => {
    if (session?.user?.userType === "influencer") {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (isPending) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!session?.user || session.user.userType !== "brand") {
    return null;
  }

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold">Analytics & ROI</h1>
          </div>
          <p className="text-sm lg:text-base text-muted-foreground">
            Track your campaign performance and influencer ROI
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs lg:text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">$45,231</div>
              <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUp className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-green-500" />
                <span className="text-green-500">+20.1%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs lg:text-sm font-medium">Campaign ROI</CardTitle>
              <TrendingUp className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">3.2x</div>
              <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUp className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-green-500" />
                <span className="text-green-500">+0.4x</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs lg:text-sm font-medium">Total Reach</CardTitle>
              <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">2.4M</div>
              <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <ArrowUp className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-green-500" />
                <span className="text-green-500">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs lg:text-sm font-medium">Active Campaigns</CardTitle>
              <Target className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl lg:text-2xl font-bold">8</div>
              <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span className="text-muted-foreground">3 ending this week</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-4 lg:space-y-6">
          <TabsList className="w-full lg:w-auto grid grid-cols-3 lg:inline-flex">
            <TabsTrigger value="campaigns" className="text-xs lg:text-sm">Campaigns</TabsTrigger>
            <TabsTrigger value="influencers" className="text-xs lg:text-sm">Influencers</TabsTrigger>
            <TabsTrigger value="affiliate" className="text-xs lg:text-sm">Affiliate</TabsTrigger>
          </TabsList>

          {/* Active Campaigns */}
          <TabsContent value="campaigns" className="space-y-4 lg:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Active Marketing Campaigns</CardTitle>
                <CardDescription className="text-xs lg:text-sm">Real-time performance of your ongoing campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 lg:space-y-4">
                  {[
                    {
                      name: "Summer Collection Launch",
                      influencer: "Sarah Johnson",
                      status: "active",
                      reach: "450K",
                      engagement: "4.2%",
                      conversions: 1250,
                      roi: "3.5x",
                    },
                    {
                      name: "Tech Product Review",
                      influencer: "Mike Chen",
                      status: "active",
                      reach: "820K",
                      engagement: "5.1%",
                      conversions: 2100,
                      roi: "4.2x",
                    },
                    {
                      name: "Wellness Partnership",
                      influencer: "Emma Davis",
                      status: "ending",
                      reach: "380K",
                      engagement: "3.8%",
                      conversions: 890,
                      roi: "2.8x",
                    },
                  ].map((campaign, index) => (
                    <div
                      key={index}
                      className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm lg:text-base">{campaign.name}</p>
                          <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="text-xs">
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-xs lg:text-sm text-muted-foreground">
                          with {campaign.influencer}
                        </p>
                      </div>
                      <div className="grid grid-cols-4 lg:flex lg:items-center gap-3 lg:gap-6 text-xs lg:text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{campaign.reach}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">Reach</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{campaign.engagement}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">Engagement</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{campaign.conversions}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">Conversions</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-green-600">{campaign.roi}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">ROI</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Influencer Performance */}
          <TabsContent value="influencers" className="space-y-4 lg:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Top Performing Influencers</CardTitle>
                <CardDescription className="text-xs lg:text-sm">Influencers driving the most value for your brand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 lg:space-y-4">
                  {[
                    {
                      name: "Mike Chen",
                      campaigns: 3,
                      totalRevenue: "$18,500",
                      avgROI: "4.2x",
                      rank: 1,
                    },
                    {
                      name: "Sarah Johnson",
                      campaigns: 2,
                      totalRevenue: "$14,200",
                      avgROI: "3.8x",
                      rank: 2,
                    },
                    {
                      name: "Alex Rodriguez",
                      campaigns: 2,
                      totalRevenue: "$12,800",
                      avgROI: "3.5x",
                      rank: 3,
                    },
                  ].map((influencer) => (
                    <div
                      key={influencer.rank}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 lg:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/10 text-primary font-bold text-sm lg:text-base flex-shrink-0">
                          #{influencer.rank}
                        </div>
                        <div>
                          <p className="font-semibold text-sm lg:text-base">{influencer.name}</p>
                          <p className="text-xs lg:text-sm text-muted-foreground">
                            {influencer.campaigns} active campaigns
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-around sm:justify-end sm:gap-6 text-xs lg:text-sm">
                        <div className="text-center sm:text-right">
                          <p className="font-semibold">{influencer.totalRevenue}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">Total Revenue</p>
                        </div>
                        <div className="text-center sm:text-right">
                          <p className="font-semibold text-green-600">{influencer.avgROI}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">Avg ROI</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Affiliate Tracking */}
          <TabsContent value="affiliate" className="space-y-4 lg:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Affiliate Link Performance</CardTitle>
                <CardDescription className="text-xs lg:text-sm">
                  Track which influencers are generating sales through affiliate links
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 lg:space-y-4">
                  {[
                    {
                      influencer: "Sarah Johnson",
                      link: "splash.co/sarah-summer",
                      clicks: 4200,
                      conversions: 580,
                      conversionRate: "13.8%",
                      revenue: "$8,700",
                    },
                    {
                      influencer: "Mike Chen",
                      link: "splash.co/mike-tech",
                      clicks: 6800,
                      conversions: 920,
                      conversionRate: "13.5%",
                      revenue: "$13,800",
                    },
                    {
                      influencer: "Alex Rodriguez",
                      link: "splash.co/alex-fitness",
                      clicks: 3500,
                      conversions: 420,
                      conversionRate: "12.0%",
                      revenue: "$6,300",
                    },
                  ].map((affiliate, index) => (
                    <div
                      key={index}
                      className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 lg:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-sm lg:text-base">{affiliate.influencer}</p>
                        <p className="text-xs lg:text-sm text-muted-foreground font-mono break-all">{affiliate.link}</p>
                      </div>
                      <div className="grid grid-cols-4 lg:flex lg:items-center gap-2 lg:gap-6 text-xs lg:text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{affiliate.clicks}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{affiliate.conversions}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">Conversions</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-green-600">{affiliate.conversionRate}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">Conv. Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{affiliate.revenue}</p>
                          <p className="text-muted-foreground text-[10px] lg:text-xs">Revenue</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
}