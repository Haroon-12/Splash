"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Briefcase, DollarSign, MessageSquare } from "lucide-react";

interface Collaboration {
    id: number;
    status: string;
    brandId: string;
    influencerId: string;
    campaignId: number;
    campaignTitle: string;
    brandName: string;
    influencerName: string;
    startedAt: string | null;
    completedAt: string | null;
}

export default function CollaborationsPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isStartingChat, setIsStartingChat] = useState<number | null>(null);

    useEffect(() => {
        if (!isPending && !session?.user) {
            router.push("/login");
            return;
        }

        if (session?.user) {
            fetchCollaborations();
        }
    }, [session, isPending, router]);

    const fetchCollaborations = async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/collaborations");
            if (!response.ok) throw new Error("Failed to fetch collaborations");

            const data = await response.json();
            setCollaborations(data.collaborations || []);
        } catch (error) {
            console.error("Error fetching collaborations:", error);
            toast.error("Failed to load your collaborations");
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (collabId: number, newStatus: string) => {
        try {
            const response = await fetch("/api/collaborations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    collaborationId: collabId,
                    status: newStatus
                })
            });

            if (response.ok) {
                toast.success(`Collaboration ${newStatus === 'active' ? 'accepted' : 'declined'}`);
                fetchCollaborations(); // Refresh the list
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating collaboration:", error);
            toast.error("An error occurred");
        }
    };

    const handleMessageClick = async (collab: Collaboration) => {
        if (!session?.user?.id) return;

        try {
            setIsStartingChat(collab.id);
            const token = localStorage.getItem("bearer_token");
            const isBrandUser = (session.user as any).userType === "brand";
            const targetUserId = isBrandUser ? collab.influencerId : collab.brandId;

            let conversationId: number;

            const conversationResponse = await fetch("/api/conversations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    participant1Id: session.user.id,
                    participant2Id: targetUserId,
                }),
            });

            if (conversationResponse.ok) {
                const data = await conversationResponse.json();
                conversationId = data.conversation.id;
            } else if (conversationResponse.status === 409) {
                const data = await conversationResponse.json();
                conversationId = data.conversationId;
            } else {
                throw new Error("Failed to start conversation");
            }

            router.push(`/dashboard/chat?conversation=${conversationId}`);
        } catch (error) {
            console.error("Error opening chat:", error);
            toast.error("Failed to open chat");
        } finally {
            setIsStartingChat(null);
        }
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

    const isBrand = (session?.user as any)?.userType === "brand";

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'active': return <Badge variant="outline" className="text-blue-500 border-blue-500"><Briefcase className="w-3 h-3 mr-1" /> Active</Badge>;
            case 'completed': return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
            case 'cancelled': return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" /> Cancelled/Declined</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <PlatformLayout>
            <div className="p-4 lg:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold mb-2">My Collaborations</h1>
                        <p className="text-muted-foreground">
                            {isBrand
                                ? "Track campaigns and influencers you are working with."
                                : "Manage your pending campaign offers and active deals."}
                        </p>
                    </div>
                </div>

                {collaborations.length === 0 ? (
                    <Card className="flex flex-col border-dashed items-center justify-center py-12">
                        <div className="rounded-full bg-primary/10 p-4 mb-4">
                            <Briefcase className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No collaborations yet</h3>
                        <p className="text-muted-foreground max-w-sm text-center mb-6">
                            {isBrand
                                ? "You haven't sent any campaign invites to influencers yet. Head to 'Browse' to discover creators."
                                : "You don't have any collaboration offers yet. Optimize your profile to attract more brands!"}
                        </p>
                        {isBrand ? (
                            <Button onClick={() => router.push("/dashboard/browse-influencers")}>Find Influencers</Button>
                        ) : (
                            <Button onClick={() => router.push("/dashboard/profile")}>Edit Profile</Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {collaborations.map((collab, index) => (
                            <motion.div
                                key={collab.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Card className="h-full flex flex-col hover:border-primary/50 transition-colors">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            {getStatusBadge(collab.status)}
                                        </div>
                                        <CardTitle className="text-xl line-clamp-1">{collab.campaignTitle}</CardTitle>
                                        <CardDescription>
                                            {isBrand ? `With ${collab.influencerName}` : `From ${collab.brandName}`}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-grow">
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Status</span>
                                                <span className="capitalize font-medium text-foreground">{collab.status}</span>
                                            </div>
                                            {collab.startedAt && (
                                                <div className="flex justify-between">
                                                    <span>Accepted On</span>
                                                    <span>{new Date(collab.startedAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {collab.completedAt && (
                                                <div className="flex justify-between">
                                                    <span>Completed On</span>
                                                    <span>{new Date(collab.completedAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex flex-col gap-2">
                                        {/* INFLUENCER VIEW: Accepting or Declining Pending Offers */}
                                        {!isBrand && collab.status === 'pending' && (
                                            <div className="flex w-full gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-1/2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                    onClick={() => updateStatus(collab.id, 'cancelled')}
                                                >
                                                    Decline
                                                </Button>
                                                <Button
                                                    className="w-1/2 bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => updateStatus(collab.id, 'active')}
                                                >
                                                    Accept Deal
                                                </Button>
                                            </div>
                                        )}

                                        {/* BRAND VIEW: Marking Active Deals as Completed */}
                                        {isBrand && collab.status === 'active' && (
                                            <Button
                                                className="w-full"
                                                onClick={() => updateStatus(collab.id, 'completed')}
                                            >
                                                Mark as Completed
                                            </Button>
                                        )}

                                        {/* BOTH VIEWS: Secondary Actions */}
                                        {collab.status === 'active' && (
                                            <Button
                                                variant="secondary"
                                                className="w-full"
                                                onClick={() => handleMessageClick(collab)}
                                                disabled={isStartingChat === collab.id}
                                            >
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                {isStartingChat === collab.id ? "Opening..." : "Message"}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </PlatformLayout>
    );
}
