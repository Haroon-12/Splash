"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Bell, X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  metadata: string | null;
  createdAt: string;
  isSmartAlert: boolean;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'all' | 'standard' | 'smart'>('all');

  useEffect(() => {
    if (session?.user) {
      // Background generator for Smart Alerts
      const generateSmartAlerts = async () => {
        try {
          const token = localStorage.getItem("bearer_token");
          await fetch("/api/notifications/generate-smart-alerts", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) {
          console.error("Failed to generate smart alerts:", e);
        }
      };

      // Generate once on load, then fetch
      generateSmartAlerts().then(() => fetchNotifications());

      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/notifications?limit=20", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.isRead).length || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to mark notifications as read");
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'claim_approved':
        return '✅';
      case 'claim_rejected':
        return '❌';
      case 'profile_update_reminder':
        return '📝';
      case 'new_message':
        return '💬';
      case 'new_profile_claim':
        return '🔔';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'claim_approved':
        return 'text-green-600';
      case 'claim_rejected':
        return 'text-red-600';
      case 'profile_update_reminder':
      case 'profile_optimization':
        return 'text-blue-600';
      case 'new_message':
        return 'text-purple-600';
      case 'campaign_match':
        return 'text-orange-500';
      case 'conversation_follow_up':
        return 'text-amber-500';
      default:
        return 'text-gray-600';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'smart') return n.isSmartAlert;
    if (activeTab === 'standard') return !n.isSmartAlert;
    return true;
  });

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />

            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed right-4 top-16 lg:right-6 lg:top-20 z-50 w-[90vw] sm:w-96 max-w-md bg-card border border-border rounded-lg shadow-lg"
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Notifications</CardTitle>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          disabled={loading}
                        >
                          <CheckCheck className="h-4 w-4 mr-1" />
                          Mark all read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex px-4 py-2 gap-2 border-b border-border">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${activeTab === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActiveTab('standard')}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${activeTab === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      Notifications
                    </button>
                    <button
                      onClick={() => setActiveTab('smart')}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 ${activeTab === 'smart' ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'}`}
                    >
                      <span>🌟</span> Smart Alerts
                    </button>
                  </div>

                  <ScrollArea className="h-96">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredNotifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 relative ${!notification.isRead ? 'bg-primary/5' : ''
                              } ${notification.isSmartAlert ? 'bg-orange-500/5' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`text-lg flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className={`text-sm font-medium truncate ${!notification.isRead ? 'font-semibold' : ''}`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 break-words">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                  {new Date(notification.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
