"use client";

import { PlatformLayout } from "@/components/platform/platform-layout";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Suspense } from "react";
import {
  CreditCard,
  Check,
  Sparkles,
  Users,
  BarChart3,
  MessageSquare,
  Zap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface Subscription {
  planType: string;
  billingInterval: string;
  status: string;
}

function BillingContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = (session?.user as any)?.userType;
  
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [teamMembers, setTeamMembers] = useState(5);

  const fetchSubscription = () => {
    fetch("/api/user/subscription")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setSubscription(data);
      });
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  // Check for successful Stripe checkout
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const success = searchParams.get("success");
    
    if (success === "true" && sessionId) {
      // Show verifying toast
      const toastId = toast.loading("Verifying your subscription upgrade...");
      
      fetch("/api/stripe/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          toast.success("Upgrade successful! Your plan has been updated.", { id: toastId });
          fetchSubscription();
          // Remove query params
          router.replace("/billing");
        } else {
          toast.error(data.error || "Verification failed", { id: toastId });
        }
      })
      .catch(() => {
        toast.error("Network error during verification", { id: toastId });
      });
    }
  }, [searchParams, router]);

  const plans = [
    {
      id: "basic",
      name: "Free",
      price: "$0",
      description: "Perfect for getting started",
      features: [
        "Browse influencers/brands",
        "View profiles and social links",
        "0 ad generations",
        "Cannot start chats",
        "Basic support",
      ],
      popular: false,
    },
    {
      id: "tier1",
      name: "Professional",
      price: interval === "monthly" ? "$25" : "$250",
      description: "For serious collaborations",
      features: [
        "Browse and chat with influencers/brands",
        interval === "monthly" ? "10 ad generations per month" : "150 ad generations per year",
        "Campaign management",
        "Basic analytics",
        "Priority support",
        "Affiliate link tracking",
      ],
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: interval === "monthly" ? "$80" : "$800",
      description: "For scaling your business",
      features: [
        "Everything in Professional",
        "Unlimited ad generations",
        "Unlimited chats",
        "Advanced analytics & ROI tracking",
        "Early access to beta features",
        "24/7 priority support",
      ],
      popular: false,
    },
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === "basic") return;
    
    try {
      setLoadingPlan(planId);
      const payload: any = { plan: planId, interval };
      if (planId === "team") {
        payload.members = teamMembers;
      }
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoadingPlan(null);
    }
  };

  const currentPlan = subscription?.planType || "basic";
  const currentInterval = subscription?.billingInterval || "monthly";

  const planHierarchy: Record<string, number> = {
    basic: 0,
    tier1: 1,
    premium: 2,
    team: 3,
  };
  const currentLevel = planHierarchy[currentPlan] || 0;

  return (
    <PlatformLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Unlock powerful features to grow your {userType === "brand" ? "brand" : "influence"}
          </p>

          {/* Toggle Monthly/Yearly */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${interval === "monthly" ? "text-primary" : "text-muted-foreground"}`}>Monthly</span>
            <button 
              onClick={() => setInterval(interval === "monthly" ? "yearly" : "monthly")}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-primary transition-transform ${interval === "yearly" ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className={`text-sm font-medium ${interval === "yearly" ? "text-primary" : "text-muted-foreground"}`}>
              Yearly <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full ml-1">Save 20%</span>
            </span>
          </div>
        </motion.div>

        {/* Current Plan Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-6 border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Status</p>
              <h2 className="text-2xl font-bold capitalize">{currentPlan} Plan {subscription?.status === "active" ? `(${currentInterval})` : ""}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {currentPlan === "basic" ? "Upgrade to unlock more features" : "Your subscription is active"}
              </p>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-sm text-muted-foreground mb-1">Access Status</p>
              <p className="text-xl font-semibold text-primary">
                {currentPlan === "premium" ? "Unlimited Access" : currentPlan === "tier1" ? "Professional Access" : "Basic Access"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {plans.map((plan, index) => {
            const isCurrent = currentPlan === plan.id;
            const planLevel = planHierarchy[plan.id] || 0;
            const isDowngrade = planLevel < currentLevel;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className={`relative bg-card rounded-2xl p-6 border-2 transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? "border-primary shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-accent text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{interval === "monthly" ? "mo" : "yr"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || plan.id === "basic" || isDowngrade || loadingPlan === plan.id}
                  className={`w-full h-12 ${
                    plan.popular
                      ? "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
                      : isCurrent || isDowngrade
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  variant={isCurrent || isDowngrade ? "outline" : "default"}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : plan.id === "basic" ? (
                    "Default Plan"
                  ) : isDowngrade ? (
                    "Included in your plan"
                  ) : (
                    "Upgrade Now"
                  )}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Team Plans Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden mt-12"
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-10 h-10" />
                  <h2 className="text-3xl font-bold">Team Plans</h2>
                </div>
                <p className="text-white/90 text-lg mb-6 max-w-2xl">
                  Need a plan for your team? Share a single subscription with multiple colleagues and enjoy unlimited chat and collaborative features.
                </p>
              </div>
              <div className="text-center bg-white/10 p-6 rounded-xl backdrop-blur-sm border border-white/20 min-w-[280px]">
                <p className="text-3xl font-bold mb-1">
                  {interval === "monthly" ? `$${80 + (teamMembers * 42)}` : `$${800 + (teamMembers * 420)}`}
                </p>
                <p className="text-sm text-white/80 mb-4">/{interval === "monthly" ? "mo" : "yr"} for {teamMembers} users</p>
                
                <div className="mb-6 text-left">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Team Size</span>
                    <span className="font-semibold">{teamMembers}</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="10" 
                    value={teamMembers} 
                    onChange={(e) => setTeamMembers(parseInt(e.target.value))}
                    className="w-full accent-white h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-xs text-white/60 mt-2">$80 base + $42/user</p>
                </div>

                <Button
                  size="lg"
                  onClick={() => handleUpgrade("team")}
                  disabled={loadingPlan === "team" || currentPlan === "team"}
                  className="bg-white text-purple-600 hover:bg-white/90 font-semibold w-full"
                >
                  {loadingPlan === "team" ? <Loader2 className="w-5 h-5 animate-spin" /> : currentPlan === "team" ? "Current Plan" : "Upgrade to Team"}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Shared Workspace</p>
                  <p className="text-sm text-white/80">Manage campaigns together</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Advanced Analytics</p>
                  <p className="text-sm text-white/80">Deep insights & reports</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Dedicated Support</p>
                  <p className="text-sm text-white/80">24/7 priority assistance</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading billing...</div>}>
      <BillingContent />
    </Suspense>
  );
}