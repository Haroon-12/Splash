"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Search } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: number;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string | null;
  createdAt: string;
  unreadCount?: number;
  participant1?: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
  participant2?: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
}

export default function ChatPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get("conversation");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchConversations();
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (conversationIdParam && conversations.length > 0) {
      const conv = conversations.find(c => c.id === parseInt(conversationIdParam));
      if (conv) {
        setSelectedConversation(conv);
        fetchMessages(conv.id);
      }
    }
  }, [conversationIdParam, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 3000); // Poll every 3 seconds for new messages

      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/conversations?userId=${session?.user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data);

      // Mark unread messages as read
      const unreadMessages = data.filter(
        (msg: Message) => !msg.isRead && msg.senderId !== session?.user?.id
      );
      
      for (const msg of unreadMessages) {
        await fetch(`/api/messages/${msg.id}/read`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !session?.user?.id) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem("bearer_token");
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          senderId: session.user.id,
          content: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setNewMessage("");
      await fetchMessages(selectedConversation.id);
      await fetchConversations(); // Refresh to update lastMessageAt
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    router.push(`/dashboard/chat?conversation=${conversation.id}`);
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (!session?.user?.id) return null;
    
    if (conversation.participant1Id === session.user.id) {
      return conversation.participant2;
    }
    return conversation.participant1;
  };

  if (isPending || isLoading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!session?.user) {
    return null;
  }

  const filteredConversations = conversations.filter((conv) => {
    const other = getOtherParticipant(conv);
    if (!other) return false;
    return (
      other.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      other.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <PlatformLayout>
      <div className="flex h-[calc(100vh-4rem)] lg:h-screen">
        {/* Conversations List */}
        <div className="w-full lg:w-80 border-r border-border flex flex-col bg-card">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {searchQuery ? "No conversations found" : "No conversations yet"}
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const other = getOtherParticipant(conversation);
                  if (!other) return null;

                  const isSelected = selectedConversation?.id === conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors text-left ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage
                          src={other.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other.name}`}
                          alt={other.name}
                        />
                        <AvatarFallback>
                          {other.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{other.name}</p>
                        <p className={`text-sm truncate ${
                          isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {other.email}
                        </p>
                      </div>
                      {conversation.unreadCount && conversation.unreadCount > 0 && !isSelected && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={
                        getOtherParticipant(selectedConversation)?.image ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${getOtherParticipant(selectedConversation)?.name}`
                      }
                      alt={getOtherParticipant(selectedConversation)?.name}
                    />
                    <AvatarFallback>
                      {getOtherParticipant(selectedConversation)?.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {getOtherParticipant(selectedConversation)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getOtherParticipant(selectedConversation)?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((message) => {
                      const isSent = message.senderId === session.user.id;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isSent
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isSent
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSending}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isSending || !newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">Select a conversation to start messaging</p>
                <p className="text-sm">Or start a new conversation from the Browse page</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
}