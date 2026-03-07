"use client";

import { motion } from "framer-motion";
import {
  Search,
  Wand2,
  Handshake,
  BarChart3,
  LineChart,
  Shield,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "AI-Powered Influencer Search",
    description:
      "Find the perfect influencers with our advanced AI matching algorithm. Filter by niche, audience, engagement, and more.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Wand2,
    title: "Automated Ad Generation",
    description:
      "Create stunning campaign content with AI. Generate ad copies, visuals, and strategies tailored to your brand.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Handshake,
    title: "Seamless Collaboration",
    description:
      "Manage all your influencer partnerships in one place. Communication, contracts, and deliverables made simple.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: LineChart, // Changed from BarChart3
    title: "Interactive Analytics", // Changed from "Real-Time Analytics"
    description:
      "Track campaign performance with detailed insights. Monitor clicks, engagement, reach, and interaction metrics.", // Changed description
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    description:
      "Built-in escrow system ensures safe transactions. Release payments upon campaign completion with confidence.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Zap,
    title: "Campaign Management",
    description:
      "Plan, execute, and optimize campaigns effortlessly. Timeline tracking, milestone management, and team collaboration.",
    color: "from-yellow-500 to-orange-500",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      </div>

      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Powerful Features for
            <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Modern Marketing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to run successful influencer campaigns, all in
            one elegant platform.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="relative p-8 h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 group hover:shadow-2xl overflow-hidden">
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-accent/0 group-hover:from-primary/5 group-hover:to-accent/5 transition-all duration-300" />

                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}