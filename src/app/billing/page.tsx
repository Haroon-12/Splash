"use client";

import { PlatformLayout } from "@/components/platform/platform-layout";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Sparkles,
  Users,
  BarChart3,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BillingPage() {
  const { data: session } = useSession();
  const userType = (session?.user as any)?.userType;

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Browse influencers/brands",
        "View profiles and social links",
        "5 ad generations per month (3 months only)",
        "Cannot start chats",
        "Basic support",
      ],
      current: true,
      cta: "Current Plan",
      popular: false,
    },
    {
      name: "Professional",
      price: "$25",
      period: "per month",
      description: "For serious collaborations",
      features: [
        "Browse and chat with influencers/brands",
        "10 ad generations per month",
        "Campaign management",
        "Basic analytics",
        "Priority support",
        "Affiliate link tracking",
      ],
      current: false,
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      name: "Unlimited",
      price: "$60",
      period: "per month",
      description: "For scaling your business",
      features: [
        "Everything in Professional",
        "Unlimited ad generations",
        "Unlimited chats",
        "Advanced analytics & ROI tracking",
        "Team collaboration (5 members)",
        "API access",
        "24/7 priority support",
      ],
      current: false,
      cta: "Upgrade to Unlimited",
      popular: false,
    },
  ];

  const handleUpgrade = (planName: string) => {
    toast.info(`Payment integration pending. You selected: ${planName}`);
  };

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
          <p className="text-muted-foreground text-lg">
            Unlock powerful features to grow your {userType === "brand" ? "brand" : "influence"}
          </p>
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
              <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
              <h2 className="text-2xl font-bold">Free Plan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upgrade to unlock more features
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Usage This Month</p>
              <p className="text-2xl font-bold">0 / 5</p>
              <p className="text-xs text-muted-foreground">Ad generations</p>
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
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
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
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">
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
                onClick={() => handleUpgrade(plan.name)}
                disabled={plan.current}
                className={`w-full h-12 ${
                  plan.popular
                    ? "bg-gradient-to-r from-primary to-accent"
                    : plan.current
                    ? ""
                    : "bg-primary"
                }`}
                variant={plan.current ? "outline" : "default"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Team Plans Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-10 h-10" />
              <h2 className="text-3xl font-bold">Team Plans</h2>
            </div>
            <p className="text-white/90 text-lg mb-6 max-w-2xl">
              Need a plan for your team? Get custom pricing with advanced features,
              dedicated support, and unlimited team members.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Unlimited Everything</p>
                  <p className="text-sm text-white/80">No limits on usage</p>
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
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
            >
              Contact Sales
            </Button>
          </div>
        </motion.div>

        {/* Payment Methods (placeholder) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Payment Methods</h2>
              <p className="text-sm text-muted-foreground">
                Manage your payment methods
              </p>
            </div>
            <Button variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>

          <div className="text-center py-8 text-muted-foreground">
            No payment methods added yet
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue
                to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens to my data if I downgrade?</h3>
              <p className="text-sm text-muted-foreground">
                Your data is always safe. If you downgrade, some features will be
                limited but your data remains accessible.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-sm text-muted-foreground">
                We offer a 14-day money-back guarantee on all paid plans. No
                questions asked.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}