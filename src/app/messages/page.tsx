"use client";

import { PlatformLayout } from "@/components/platform/platform-layout";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Circle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";

export default function MessagesPage() {
  const { data: session } = useSession();
  const userType = (session?.user as any)?.userType;
  const [selectedChat, setSelectedChat] = useState<number | null>(1);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Placeholder conversations
  const conversations = [
    {
      id: 1,
      name: userType === "brand" ? "Sarah Johnson" : "Tech Brand Inc",
      type: userType === "brand" ? "Influencer" : "Brand",
      lastMessage: "That sounds great! When can we start?",
      timestamp: "2m ago",
      unread: 2,
      online: true,
      avatar: "S",
    },
    {
      id: 2,
      name: userType === "brand" ? "Mike Chen" : "Fashion Co",
      type: userType === "brand" ? "Influencer" : "Brand",
      lastMessage: "I'd love to collaborate on this campaign",
      timestamp: "1h ago",
      unread: 0,
      online: false,
      avatar: "M",
    },
    {
      id: 3,
      name: userType === "brand" ? "Emma Davis" : "Food Brands LLC",
      type: userType === "brand" ? "Influencer" : "Brand",
      lastMessage: "Thank you for reaching out!",
      timestamp: "3h ago",
      unread: 0,
      online: true,
      avatar: "E",
    },
  ];

  // Placeholder messages for selected chat
  const messages = selectedChat
    ? [
        {
          id: 1,
          sender: "them",
          content: "Hi! Thanks for reaching out!",
          timestamp: "10:30 AM",
        },
        {
          id: 2,
          sender: "me",
          content: "I'd love to discuss a potential collaboration",
          timestamp: "10:32 AM",
        },
        {
          id: 3,
          sender: "them",
          content: "That sounds great! When can we start?",
          timestamp: "10:35 AM",
        },
      ]
    : [];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // TODO: Send message via API
    setMessage("");
  };

  const selectedConversation = conversations.find(
    (conv) => conv.id === selectedChat
  );

  return (
    <PlatformLayout>
      <div className="flex h-[calc(100vh-2rem)] m-4">
        {/* Conversations List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-80 bg-card border-r border-border flex flex-col rounded-l-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedChat(conv.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all duration-200 hover:bg-muted ${
                    selectedChat === conv.id
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <Circle
                          className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500 border-2 border-card"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold truncate">{conv.name}</p>
                        <span
                          className={`text-xs ${
                            selectedChat === conv.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {conv.timestamp}
                        </span>
                      </div>
                      <p
                        className={`text-sm truncate ${
                          selectedChat === conv.id
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {conv.lastMessage}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          selectedChat === conv.id
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {conv.type}
                      </p>
                    </div>
                    {conv.unread > 0 && selectedChat !== conv.id && (
                      <div className="w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center flex-shrink-0">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 bg-card flex flex-col rounded-r-2xl"
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                      {selectedConversation.avatar}
                    </div>
                    {selectedConversation.online && (
                      <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500 border-2 border-card" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {selectedConversation.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === "me" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          msg.sender === "me"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender === "me"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="bg-gradient-to-r from-primary to-accent"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </PlatformLayout>
  );
}