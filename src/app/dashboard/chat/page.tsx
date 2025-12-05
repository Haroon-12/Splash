"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Search, Paperclip, Image as ImageIcon, Mic, X } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: number;
  conversationId: number;
  senderId: string;
  content: string;
  attachmentType?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
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
  const [attachment, setAttachment] = useState<{
    type: 'image' | 'document' | 'voice';
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

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
        fetchMessages(conv.id, true); // Mark as read when opening
      }
    }
  }, [conversationIdParam, conversations]);

  useEffect(() => {
    if (selectedConversation) {
      // Mark messages as read when opening chat
      fetchMessages(selectedConversation.id, true);
      
      const interval = setInterval(() => {
        // When chat is open, mark new messages as read automatically
        fetchMessages(selectedConversation.id, true);
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

  const fetchMessages = async (conversationId: number, markAsRead: boolean = true) => {
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

      // Mark unread messages as read if chat is open
      if (markAsRead && selectedConversation?.id === conversationId) {
        const unreadMessages = data.filter(
          (msg: Message) => !msg.isRead && msg.senderId !== session?.user?.id
        );
        
        if (unreadMessages.length > 0) {
          // Mark all unread messages as read
          await Promise.all(
            unreadMessages.map((msg: Message) =>
              fetch(`/api/messages/${msg.id}/read`, {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
            )
          );
          
          // Refresh conversations to update unread count
          await fetchConversations();
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine attachment type
    let attachmentType: 'image' | 'document' | 'voice' = 'document';
    if (file.type.startsWith('image/')) {
      attachmentType = 'image';
    } else if (file.type.startsWith('audio/')) {
      attachmentType = 'voice';
    }

    try {
      setIsSending(true);
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadData = await uploadResponse.json();
      setAttachment({
        type: attachmentType,
        url: uploadData.fileUrl,
        name: uploadData.originalName,
        size: uploadData.size,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsSending(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        
        try {
          setIsSending(true);
          const formData = new FormData();
          formData.append('file', file);

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload voice note');
          }

          const uploadData = await uploadResponse.json();
          setAttachment({
            type: 'voice',
            url: uploadData.fileUrl,
            name: 'Voice Note',
            size: uploadData.size,
          });
        } catch (error) {
          console.error('Error uploading voice note:', error);
          toast.error('Failed to upload voice note');
        } finally {
          setIsSending(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !selectedConversation || !session?.user?.id) return;

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
          content: newMessage.trim() || '',
          attachmentType: attachment?.type || null,
          attachmentUrl: attachment?.url || null,
          attachmentName: attachment?.name || null,
          attachmentSize: attachment?.size || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setNewMessage("");
      setAttachment(null);
      await fetchMessages(selectedConversation.id, false); // Don't mark own messages as read
      await fetchConversations(); // Refresh to update lastMessageAt and unread count
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleConversationClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id, true); // Mark as read when opening
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
      <div className="flex h-[calc(100vh-4rem)] lg:h-screen overflow-hidden">
        {/* Conversations List */}
        <div className="w-full lg:w-80 border-r border-border flex flex-col bg-card overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-border flex-shrink-0">
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
          <ScrollArea className="flex-1 overflow-hidden">
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
                          src={other.image || undefined}
                          alt={other.name}
                        />
                        <AvatarFallback>
                          {other.name ? other.name.charAt(0).toUpperCase() : 'U'}
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
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
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
        <div className="flex-1 flex flex-col bg-background overflow-hidden">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={getOtherParticipant(selectedConversation)?.image || undefined}
                      alt={getOtherParticipant(selectedConversation)?.name || ''}
                    />
                    <AvatarFallback>
                      {getOtherParticipant(selectedConversation)?.name 
                        ? getOtherParticipant(selectedConversation)?.name.charAt(0).toUpperCase() 
                        : 'U'}
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
              <ScrollArea className="flex-1 overflow-hidden">
                <div className="p-4">
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
                            {message.attachmentUrl && (
                              <div className="mb-2">
                                {message.attachmentType === 'image' && (
                                  <div className="space-y-2">
                                    <img
                                      src={message.attachmentUrl}
                                      alt={message.attachmentName || 'Image'}
                                      className="max-w-full rounded-lg max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(message.attachmentUrl!, '_blank')}
                                    />
                                    <a
                                      href={message.attachmentUrl}
                                      download={message.attachmentName || 'image'}
                                      className={`text-xs underline flex items-center gap-1 ${
                                        isSent
                                          ? "text-primary-foreground/70 hover:text-primary-foreground"
                                          : "text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      Download Image
                                    </a>
                                  </div>
                                )}
                                {message.attachmentType === 'voice' && (
                                  <div className="space-y-2">
                                    <audio controls className="w-full">
                                      <source src={message.attachmentUrl} type="audio/webm" />
                                      <source src={message.attachmentUrl} type="audio/mpeg" />
                                      <source src={message.attachmentUrl} type="audio/wav" />
                                      Your browser does not support audio playback.
                                    </audio>
                                    <a
                                      href={message.attachmentUrl}
                                      download={message.attachmentName || 'voice-note.webm'}
                                      className={`text-xs underline flex items-center gap-1 ${
                                        isSent
                                          ? "text-primary-foreground/70 hover:text-primary-foreground"
                                          : "text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      <Paperclip className="w-3 h-3" />
                                      Download Voice Note
                                    </a>
                                  </div>
                                )}
                                {message.attachmentType === 'document' && (
                                  <div className="space-y-2">
                                    <div className={`flex items-center gap-2 p-2 rounded ${
                                      isSent
                                        ? "bg-primary/20"
                                        : "bg-background"
                                    }`}>
                                      <Paperclip className="w-4 h-4" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {message.attachmentName || 'Document'}
                                        </p>
                                        {message.attachmentSize && (
                                          <p className={`text-xs ${
                                            isSent
                                              ? "text-primary-foreground/70"
                                              : "text-muted-foreground"
                                          }`}>
                                            {(message.attachmentSize / 1024).toFixed(1)} KB
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <a
                                        href={message.attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`text-xs px-3 py-1 rounded ${
                                          isSent
                                            ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                                            : "bg-primary/10 text-primary hover:bg-primary/20"
                                        } transition-colors`}
                                      >
                                        Open
                                      </a>
                                      <a
                                        href={message.attachmentUrl}
                                        download={message.attachmentName || 'document'}
                                        className={`text-xs px-3 py-1 rounded ${
                                          isSent
                                            ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                                            : "bg-primary/10 text-primary hover:bg-primary/20"
                                        } transition-colors`}
                                      >
                                        Download
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {message.content && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            )}
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
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card flex-shrink-0">
                {attachment && (
                  <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {attachment.type === 'image' && <ImageIcon className="w-4 h-4" />}
                      {attachment.type === 'voice' && <Mic className="w-4 h-4" />}
                      {attachment.type === 'document' && <Paperclip className="w-4 h-4" />}
                      <span className="text-sm">{attachment.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachment(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isSending || isRecording}
                      className="flex-1 pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                      <input
                        type="file"
                        id="file-input"
                        className="hidden"
                        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileSelect}
                        disabled={isSending || isRecording}
                      />
                      <label htmlFor="file-input">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={isSending || isRecording}
                          asChild
                        >
                          <span>
                            <Paperclip className="h-4 w-4" />
                          </span>
                        </Button>
                      </label>
                      <input
                        type="file"
                        id="image-input"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isSending || isRecording}
                      />
                      <label htmlFor="image-input">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={isSending || isRecording}
                          asChild
                        >
                          <span>
                            <ImageIcon className="h-4 w-4" />
                          </span>
                        </Button>
                      </label>
                      {!isRecording ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={handleStartRecording}
                          disabled={isSending}
                        >
                          <Mic className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={handleStopRecording}
                        >
                          <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSending || isRecording || (!newMessage.trim() && !attachment)}
                  >
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