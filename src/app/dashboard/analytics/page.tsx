"use client";

import { redirect } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { AnalyticsDashboard } from "@/components/platform/analytics-dashboard";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UpgradeRequired } from "@/components/platform/upgrade-required";

export default function AnalyticsPage() {
  const { data: session, isPending } = useSession();
  const [subStatus, setSubStatus] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/subscription")
      .then(res => res.json())
      .then(data => {
        setSubStatus(data);
        setSubLoading(false);
      })
      .catch(() => setSubLoading(false));
  }, []);

  if (isPending || subLoading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!session?.user) {
    redirect("/login");
  }

  const userType = (session.user as any)?.userType;

  // Analytics is primarily for brands, but influencers might have a simplified view later
  if (userType !== "brand" && userType !== "admin") {
    return (
      <PlatformLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <h1 className="text-3xl font-bold tracking-tight mb-4 text-slate-800 dark:text-slate-100">
            Influencer Analytics
          </h1>
          <p className="text-muted-foreground max-w-md">
            Detailed link tracking is currently available for Brand accounts. As an influencer, you can view your overall metrics on your profile page.
          </p>
        </div>
      </PlatformLayout>
    );
  }

  if (userType === "brand" && subStatus?.planType === "basic") {
    return (
      <UpgradeRequired 
        withLayout
        title="Analytics Locked"
        description="Detailed campaign analytics and link tracking are only available on Professional and Premium plans. Upgrade to gain deep insights into your influencer campaigns."
        buttonText="Upgrade Plan"
      />
    );
  }

  return (
    <PlatformLayout>
      <div className="flex flex-col gap-8 pb-10 p-4 lg:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Campaign Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate custom tracking links and monitor real-time interaction data across your campaigns.
          </p>
        </div>

        <AnalyticsDashboard />
      </div>
    </PlatformLayout>
  );
}