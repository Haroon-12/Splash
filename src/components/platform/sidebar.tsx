"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Sparkles,
  MessageSquare,
  Bot,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  X,
  Shield,
  FileText,
  Edit3,
  UserPlus,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient, useSession } from "@/lib/auth-client";
import { NotificationBell } from "./notification-bell";
import { toast } from "sonner";

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();

  const userType = (session?.user as any)?.userType;
  const isAdmin = userType === "admin";

  const navigation = [
    {
      name: "Admin Dashboard",
      href: "/admin/dashboard",
      icon: Shield,
      show: isAdmin,
    },
    {
      name: "Create Accounts",
      href: "/admin/create-accounts",
      icon: UserPlus,
      show: isAdmin,
    },
    { name: "Home", href: "/dashboard", icon: Home, show: true },
    {
      name: "Browse Influencers",
      href: "/dashboard/browse-influencers",
      icon: Search,
      show: userType === "brand" || isAdmin,
    },
    {
      name: "Browse Brands",
      href: "/dashboard/browse-brands",
      icon: Search,
      show: userType === "influencer" || isAdmin,
    },
    {
      name: "Edit Profile",
      href: "/dashboard/profile/edit",
      icon: Edit3,
      show: userType === "influencer",
    },
    {
      name: "Ad Generation",
      href: "/dashboard/ad-generation",
      icon: Sparkles,
      show: userType === "brand",
    },
    {
      name: "Collaborations",
      href: "/dashboard/collaborations",
      icon: Handshake,
      show: userType === "brand" || userType === "influencer",
    },
    { name: "Messages", href: "/dashboard/chat", icon: MessageSquare, show: true },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: BarChart3,
      show: userType === "brand" || isAdmin,
    },
  ];

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      router.push("/");
    }
  };

  if (isPending) {
    return (
      <div className="h-screen w-60 bg-card border-r border-border flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onMobileClose}>
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent shadow-lg flex-shrink-0">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/d4da868e-2367-49e8-9d0e-3d7165baadc1/generated_images/luxury-elegant-logo-for-brand-influencer-7f3c7392-20251001190021.jpg?"
              alt="Splash Logo"
              fill
              className="object-cover"
            />
          </div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
          >
            Splash
          </motion.span>
        </Link>
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-2 hover:bg-accent rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link href={item.href} key={item.name} onClick={onMobileClose}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-3 border-t border-border space-y-2">
        {session?.user && (
          <div className="px-3 py-2 rounded-lg bg-muted">
            <p className="text-sm font-medium truncate">
              {(session.user as any).name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {(session.user as any).email}
            </p>
            <p className={`text-xs font-medium mt-1 capitalize ${isAdmin ? 'text-accent' : 'text-primary'}`}>
              {isAdmin ? '👑 Admin' : `${userType} Account`}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="default"
            onClick={handleSignOut}
            className="flex-1 justify-start"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Sign Out</span>
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Always Visible */}
      <aside className="hidden lg:flex h-screen w-60 bg-card border-r border-border flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            {/* Sidebar Drawer */}
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden fixed left-0 top-0 h-screen w-60 bg-card border-r border-border flex flex-col z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}