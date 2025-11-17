"use client";

import { PlatformLayout } from "@/components/platform/platform-layout";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export default function HelpPage() {
  const { data: session } = useSession();
  const userName = (session?.user as any)?.name || "User";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      content: `Hi ${userName}! 👋 I'm your Splash AI assistant. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const suggestedQuestions = [
    "How do I browse influencers?",
    "How does ad generation work?",
    "What are the pricing plans?",
    "How do I upgrade my account?",
    "How does the affiliate system work?",
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, userMessage]);
    setMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        sender: "bot",
        content:
          "Thanks for your question! This is a placeholder response. The AI chatbot will be integrated with a language model API to provide real-time assistance.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <PlatformLayout>
      <div className="flex flex-col h-[calc(100vh-2rem)] m-4 bg-card rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                AI Help Assistant
                <Sparkles className="w-5 h-5 text-accent" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Ask me anything about Splash
              </p>
            </div>
          </div>
        </motion.div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4 max-w-3xl mx-auto"
          >
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {msg.sender === "bot" && (
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-5 h-5 text-accent" />
                      <span className="text-sm font-semibold">
                        AI Assistant
                      </span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      msg.sender === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </ScrollArea>

        {/* Suggested Questions (shown when chat is empty or at start) */}
        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="px-6 pb-4 max-w-3xl mx-auto w-full"
          >
            <p className="text-sm text-muted-foreground mb-3">
              Suggested questions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-6 border-t border-border bg-muted/30"
        >
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <Input
              placeholder="Ask me anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              className="flex-1 h-12"
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="h-12 w-12 bg-gradient-to-r from-primary to-accent"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-3">
            AI responses are generated. Always verify important information.
          </p>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}