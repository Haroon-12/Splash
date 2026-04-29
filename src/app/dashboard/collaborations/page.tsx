"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Briefcase, MessageSquare } from "lucide-react";

interface Collaboration {
    id: number;
    status: string;
    dealAmount: number | null;
    proposedAmount: number | null;
    negotiationStatus: string;
    paymentStatus: string;
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

    const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
    const [proposeCollabId, setProposeCollabId] = useState<number | null>(null);
    const [proposedAmount, setProposedAmount] = useState("");

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



    const updateStatus = async (collabId: number, newStatus: string, extraData: any = {}) => {
        try {
            const response = await fetch("/api/collaborations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    collaborationId: collabId,
                    status: newStatus,
                    ...extraData
                })
            });

            if (response.ok) {
                toast.success(`Collaboration updated successfully`);
                setIsProposeModalOpen(false);
                fetchCollaborations();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to update status");
            }
        } catch (error) {
            console.error("Error updating collaboration:", error);
            toast.error("An error occurred");
        }
    };

    const handleProposeSubmit = () => {
        if (!proposedAmount || isNaN(Number(proposedAmount)) || Number(proposedAmount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }
        if (proposeCollabId) {
            updateStatus(proposeCollabId, "propose", { proposedAmount: Math.round(Number(proposedAmount) * 100) });
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
                const errorData = await conversationResponse.json();
                if (errorData.code === "PLAN_UPGRADE_REQUIRED") {
                    toast.error(errorData.error);
                    return;
                }
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

    const getStatusBadge = (collab: Collaboration) => {
        if (collab.status === 'pending') {
            if (collab.negotiationStatus === 'pending_influencer') {
                return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" /> Waiting for Influencer</Badge>;
            } else if (collab.negotiationStatus === 'pending_brand') {
                return <Badge variant="outline" className="text-orange-500 border-orange-500"><Clock className="w-3 h-3 mr-1" /> Waiting for Brand</Badge>;
            }
            return <Badge variant="outline" className="text-yellow-500 border-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
        }
        if (collab.status === 'active') {
            return <Badge variant="outline" className="text-blue-500 border-blue-500"><Briefcase className="w-3 h-3 mr-1" /> Active</Badge>;
        }
        if (collab.status === 'completed') return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
        if (collab.status === 'cancelled') return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" /> Cancelled/Declined</Badge>;
        
        return <Badge variant="outline">{collab.status}</Badge>;
    };

    const formatCurrency = (cents: number | null) => {
        if (cents === null) return "N/A";
        return `$${(cents / 100).toFixed(2)}`;
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
                                            {getStatusBadge(collab)}
                                        </div>
                                        <CardTitle className="text-xl line-clamp-1">{collab.campaignTitle}</CardTitle>
                                        <CardDescription>
                                            {isBrand ? `With ${collab.influencerName}` : `From ${collab.brandName}`}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="flex-grow">
                                        <div className="space-y-3 text-sm text-muted-foreground">
                                            <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                                                <span className="font-medium">Deal Amount</span>
                                                <span className="font-bold text-foreground text-base">
                                                    {formatCurrency(collab.dealAmount)}
                                                </span>
                                            </div>
                                            
                                            {collab.proposedAmount && collab.negotiationStatus === 'pending_brand' && (
                                                <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-950/30 rounded-md">
                                                    <span className="font-medium text-orange-600 dark:text-orange-400">Counter Offer</span>
                                                    <span className="font-bold text-orange-600 dark:text-orange-400 text-base">
                                                        {formatCurrency(collab.proposedAmount)}
                                                    </span>
                                                </div>
                                            )}

                                            {collab.startedAt && (
                                                <div className="flex justify-between">
                                                    <span>Accepted On</span>
                                                    <span>{new Date(collab.startedAt).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>

                                    <CardFooter className="flex flex-col gap-2">
                                        {/* INFLUENCER VIEW: Pending Offer */}
                                        {!isBrand && collab.status === 'pending' && collab.negotiationStatus === 'pending_influencer' && (
                                            <div className="flex flex-col w-full gap-2">
                                                <Button
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => updateStatus(collab.id, 'active')}
                                                >
                                                    Accept Deal ({formatCurrency(collab.dealAmount)})
                                                </Button>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="w-1/2"
                                                        onClick={() => {
                                                            setProposeCollabId(collab.id);
                                                            setIsProposeModalOpen(true);
                                                        }}
                                                    >
                                                        Counter
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="w-1/2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                        onClick={() => updateStatus(collab.id, 'cancelled')}
                                                    >
                                                        Decline
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* BRAND VIEW: Influencer counter-offered */}
                                        {isBrand && collab.status === 'pending' && collab.negotiationStatus === 'pending_brand' && (
                                            <div className="flex flex-col w-full gap-2">
                                                <Button
                                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                                    onClick={() => updateStatus(collab.id, 'agree_proposal')}
                                                >
                                                    Accept Counter ({formatCurrency(collab.proposedAmount)})
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                    onClick={() => updateStatus(collab.id, 'cancelled')}
                                                >
                                                    Decline
                                                </Button>
                                            </div>
                                        )}

                                        {/* BRAND VIEW: Marking Active Deals as Completed */}
                                        {isBrand && collab.status === 'active' && (
                                            <Button
                                                className="w-full bg-green-600 hover:bg-green-700 text-white"
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

                {/* Propose Counter Offer Modal */}
                <Dialog open={isProposeModalOpen} onOpenChange={setIsProposeModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Counter Offer</DialogTitle>
                            <DialogDescription>
                                Propose a different deal amount to the brand. They will review it and can choose to accept or decline.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Your Proposed Amount ($)</label>
                                <Input 
                                    type="number" 
                                    min="1" 
                                    placeholder="e.g. 150" 
                                    value={proposedAmount} 
                                    onChange={(e) => setProposedAmount(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsProposeModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleProposeSubmit}>
                                Send Counter Offer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </PlatformLayout>
    );
}
