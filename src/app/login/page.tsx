"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (error?.code) {
        console.error("Login error:", error);
        
        // Check if it's a suspension error
        if (error.message && error.message.includes("suspended")) {
          toast.error("Your account has been suspended. Please contact support for assistance.");
        } else {
          toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        }
        
        setIsLoading(false);
        return;
      }

      console.log("Login successful, data:", data);
      console.log("Session after login:", data?.session);
      console.log("User after login:", data?.session?.user);

      toast.success("Welcome back!");
      
      // Wait for session to be fully established
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("About to navigate to dashboard");
      
      // Navigate to dashboard using router
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login exception:", err);
      toast.error(err.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to your Splash account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="off"
                  className="h-12"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="text-center text-sm">
              <Link href="/register" className="text-primary hover:underline font-medium">
                Create an account
              </Link>
              <p className="text-muted-foreground mt-2">
                Register as a brand or influencer to get started
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-accent to-primary p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-10 text-white space-y-8 max-w-md"
        >
          <h2 className="text-5xl font-bold">Splash Platform</h2>
          <p className="text-xl text-white/90">
            Connect, collaborate, and grow with the ultimate brand-influencer platform.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Influencer Discovery</h3>
                <p className="text-white/80 text-sm">
                  Find the perfect influencers for your campaigns
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">AI-Powered Ad Generation</h3>
                <p className="text-white/80 text-sm">
                  Create compelling marketing content instantly
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <div>
                <h3 className="font-semibold">Real-Time Analytics</h3>
                <p className="text-white/80 text-sm">
                  Track performance and ROI with detailed insights
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}