"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSearchParams, usePathname } from "next/navigation";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Detect if we are inside the chat interface and have a conversation selected
  const isMessageRoute = pathname?.includes("/dashboard/chat");
  const urlConversationId = searchParams.get("conversation");
  const conversationId = isMessageRoute && urlConversationId ? Number(urlConversationId) : null;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm Splash AI Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const quickActions = conversationId
    ? ["Summarize this chat", "Suggest a polite reply", "What did the brand offer?"]
    : ["How do I browse influencers?", "What are the pricing plans?", "How does ad generation work?", "Contact support"];

  // Update initial message if route changes
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: conversationId
          ? "I am connected to this specific chat thread. I can help summarize or draft replies for you. What do you need?"
          : "Hi! I'm Splash Assist. I can help you navigate the platform. Note: I cannot read your messages unless you open a specific chat thread.",
        sender: "bot",
        timestamp: new Date(),
      }
    ]);
  }, [conversationId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: currentInput,
          conversationId: conversationId
        })
      });

      const data = await res.json();

      const botResponse: Message = {
        id: messages.length + 2,
        text: data.response || "I'm sorry, I'm having trouble connecting to the AI brain.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: messages.length + 2,
        text: "Error reaching servers. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    // Timeout needed to let state update before firing
    setTimeout(() => {
      const btn = document.getElementById('chat-send-btn');
      btn?.click();
    }, 50);
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-transform hover:scale-105"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-2 border-primary/20">
          <CardHeader className="border-b bg-primary text-primary-foreground py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" />
              Splash AI Assistant
            </CardTitle>
            <p className="text-xs opacity-90">
              {conversationId ? "🔒 Context-Locked Mode (Reading active chat)" : "🌐 Global Mode (Platform Guide)"}
            </p>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollRef}>
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-start gap-2 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse" : ""
                        }`}
                    >
                      <Avatar className="h-8 w-8 mt-1 border border-primary/20">
                        <AvatarFallback className={message.sender === "bot" ? "bg-primary text-primary-foreground" : "bg-neutral-200 text-neutral-800"}>
                          {message.sender === "bot" ? "AI" : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-xl p-3 shadow-sm ${message.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted border border-border rounded-tl-sm"
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${message.sender === "user" ? "opacity-70" : "text-muted-foreground"
                          }`}>
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[80%]">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-primary text-primary-foreground">AI</AvatarFallback>
                      </Avatar>
                      <div className="rounded-xl p-3 bg-muted border border-border rounded-tl-sm flex items-center justify-center min-w-[60px]">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                {messages.length === 1 && !isLoading && (
                  <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Suggested:</p>
                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickAction(action)}
                          className="text-xs h-auto py-1.5 px-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {action}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t p-3 bg-card rounded-b-xl">
            <div className="flex gap-2 w-full relative">
              <Input
                placeholder={conversationId ? "Ask about this chat..." : "Ask me anything..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1 pr-10 focus-visible:ring-primary/50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                size="icon"
                id="chat-send-btn"
                className="absolute right-1 top-1 bottom-1 h-auto w-8 rounded transition-all"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}