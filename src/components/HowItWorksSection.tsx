"use client";

import { motion } from "framer-motion";
import { Search, Sparkles, TrendingUp, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description:
      "Use our AI-powered search to find the perfect influencers or brands that align with your values and goals.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Sparkles,
    title: "Collaborate",
    description:
      "Connect seamlessly with our built-in tools for contracts, content approval, and real-time communication.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Grow",
    description:
      "Track performance with detailed analytics and scale your campaigns with data-driven insights.",
    color: "from-orange-500 to-red-500",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background" />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Simple & Effective
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            How Splash Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes and launch your first campaign with just
            three simple steps
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5">
              <div className="relative w-full h-full">
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 origin-left"
                />
              </div>
            </div>

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative flex flex-col items-center text-center"
                >
                  {/* Step Number Background */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="relative mb-8"
                  >
                    {/* Animated Ring */}
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-0 rounded-full bg-gradient-to-r opacity-20"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${step.color})`,
                        padding: "4px",
                      }}
                    />

                    {/* Icon Container */}
                    <div
                      className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${step.color} shadow-2xl flex items-center justify-center`}
                    >
                      <Icon className="w-12 h-12 text-white" />
                      
                      {/* Step Number Badge */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-primary">
                        {index + 1}
                      </div>
                    </div>
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}