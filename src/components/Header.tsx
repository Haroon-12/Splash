"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      setIsScrolled(window.scrollY > 20);
    });
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-accent shadow-lg">
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/d4da868e-2367-49e8-9d0e-3d7165baadc1/generated_images/luxury-elegant-logo-for-brand-influencer-7f3c7392-20251001190021.jpg?"
                  alt="Splash Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Splash
              </span>
            </motion.div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              How It Works
            </a>
            <a
              href="#"
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              Benefits
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex font-medium hover:bg-primary/10"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg font-medium"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}