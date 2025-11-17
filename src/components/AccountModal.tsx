"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, User, Mail, Lock, Sparkles } from "lucide-react";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "brand" | "influencer";
}

export default function AccountModal({
  isOpen,
  onClose,
  type,
}: AccountModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    bio: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    onClose();
  };

  const isBrand = type === "brand";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                isBrand
                  ? "from-blue-500 to-cyan-500"
                  : "from-purple-500 to-pink-500"
              } shadow-lg flex items-center justify-center`}
            >
              {isBrand ? (
                <Building2 className="w-6 h-6 text-white" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl">
                {isBrand ? "Create Brand Account" : "Join as Influencer"}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base">
            {isBrand
              ? "Start collaborating with top influencers and grow your brand."
              : "Connect with leading brands and monetize your influence."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base">
              {isBrand ? "Brand Name" : "Full Name"}
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="name"
                placeholder={isBrand ? "Your Brand" : "John Doe"}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-base">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10 h-12"
                required
              />
            </div>
          </div>

          {/* Company (Brand only) */}
          {isBrand && (
            <div className="space-y-2">
              <Label htmlFor="company" className="text-base">
                Company Website
              </Label>
              <Input
                id="company"
                type="url"
                placeholder="https://yourbrand.com"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="h-12"
              />
            </div>
          )}

          {/* Bio (Influencer only) */}
          {!isBrand && (
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-base">
                Bio
              </Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself and your content..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg text-base font-semibold"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Create Account
          </Button>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}