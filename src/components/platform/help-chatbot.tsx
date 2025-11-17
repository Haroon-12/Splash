"use client";

import { useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function HelpChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm Splash AI Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const quickActions = [
    "How do I browse influencers?",
    "What are the pricing plans?",
    "How does ad generation work?",
    "Contact support",
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes("browse") || lowerQuestion.includes("influencer")) {
      return "To browse influencers, go to the 'Browse Influencers' page from the sidebar. You can search by name, category, or location. Only influencers with active accounts can be contacted directly.";
    } else if (lowerQuestion.includes("pricing") || lowerQuestion.includes("plan")) {
      return "We offer 3 plans: Free (5 ad generations, browse only), Pro ($25/month - chat + 10 ads), and Premium ($60/month - unlimited). Would you like more details about any specific plan?";
    } else if (lowerQuestion.includes("ad generation") || lowerQuestion.includes("generate")) {
      return "Our AI Ad Generation tool creates professional marketing ads in seconds. Just provide your campaign details, choose a style, and our AI will generate stunning visuals for your campaigns. Visit the 'Ad Generation' page to try it out!";
    } else if (lowerQuestion.includes("contact") || lowerQuestion.includes("support")) {
      return "For support, you can email us at support@splash.com or use the contact form on our website. Our team typically responds within 24 hours.";
    } else {
      return "I understand you're asking about: '" + question + "'. Could you provide more details? Or try one of the quick actions below for common questions.";
    }
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    handleSendMessage();
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chatbot Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="border-b bg-primary text-primary-foreground">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Splash AI Assistant
            </CardTitle>
            <p className="text-sm opacity-90">How can we help you today?</p>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-start gap-2 max-w-[80%] ${
                        message.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={message.sender === "bot" ? "bg-primary text-primary-foreground" : ""}>
                          {message.sender === "bot" ? "AI" : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === "user" ? "opacity-70" : "text-muted-foreground"
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

                {/* Quick Actions */}
                {messages.length === 1 && (
                  <div className="space-y-2 pt-4">
                    <p className="text-sm text-muted-foreground">Quick actions:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action)}
                          className="justify-start text-left h-auto py-2"
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

          <CardFooter className="border-t p-4">
            <div className="flex gap-2 w-full">
              <Input
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}