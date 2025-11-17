"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { useSession } from "@/lib/auth-client";
import HelpChatbot from "./help-chatbot";
import { NotificationBell } from "./notification-bell";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export function PlatformLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('PlatformLayout - Session check:', { session, isPending });
    console.log('PlatformLayout - User:', session?.user);
    console.log('PlatformLayout - User type:', (session?.user as any)?.userType);
    console.log('PlatformLayout - User approved:', (session?.user as any)?.isApproved);
    
    // Add a small delay to ensure session is fully loaded
    const timer = setTimeout(() => {
      // Only redirect if we're sure there's no session after loading is complete
      if (!isPending && !session?.user) {
        console.log('No session found, redirecting to login');
        router.push("/login");
        return;
      }
      
      // Check if user is suspended
      if (!isPending && session?.user && (session.user as any)?.isApproved === false) {
        console.log('User is suspended, redirecting to login');
        router.push("/login");
        return;
      }
      
      console.log('PlatformLayout - Session valid, rendering content');
    }, 200);
    
    return () => clearTimeout(timer);
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-lg font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Splash
            </span>
          </div>
          <NotificationBell />
        </header>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <HelpChatbot />
    </div>
  );
}