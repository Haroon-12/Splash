"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Eye, TrendingUp, Link as LinkIcon, Calendar, Copy, Check, MousePointerClick, Activity, Globe, Smartphone, Share2, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trophy, Medal, Users } from "lucide-react";

export function AnalyticsDashboard() {
    const [links, setLinks] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [destinationUrl, setDestinationUrl] = useState("");
    const [campaignId, setCampaignId] = useState("");
    const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Context State
    const [campaignDropdown, setCampaignDropdown] = useState<any[]>([]);
    const [influencerDropdown, setInfluencerDropdown] = useState<any[]>([]);
    const [collaborations, setCollaborations] = useState<any[]>([]);

    const fetchLinksAndContext = async () => {
        try {
            const [affiliatesRes, contextRes] = await Promise.all([
                fetch("/api/affiliates"),
                fetch("/api/affiliates/context")
            ]);

            if (affiliatesRes.ok) {
                const data = await affiliatesRes.json();
                setLinks(data.links || []);

                const activeChartData = data.chartData && data.chartData.length > 0
                    ? data.chartData
                    : [{ date: format(new Date(), 'MMM dd'), totalClicks: 0 }];

                setChartData(activeChartData);
                setMetrics(data.metrics || null);
            }

            if (contextRes.ok) {
                const ctx = await contextRes.json();
                setCampaignDropdown(ctx.campaigns || []);
                setInfluencerDropdown(ctx.influencers || []);
                setCollaborations(ctx.collaborations || []);
            }
        } catch (e) {
            console.error("Failed to fetch dashboard data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLinksAndContext();
    }, []);

    const toggleInfluencer = (id: string) => {
        setSelectedInfluencers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!destinationUrl) {
            toast.error("Destination URL is required");
            return;
        }

        setGenerating(true);
        try {
            const res = await fetch("/api/affiliates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title || "New Campaign Link",
                    destinationUrl,
                    campaignId: campaignId === "none" ? undefined : campaignId,
                    influencerIds: selectedInfluencers.length > 0 ? selectedInfluencers : undefined
                }),
            });

            if (res.ok) {
                toast.success("Affiliate link generated!");
                setTitle("");
                setDestinationUrl("");
                setCampaignId("");
                setSelectedInfluencers([]);
                fetchLinksAndContext();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to generate link");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (id: string) => {
        const fullUrl = `${window.location.origin}/api/track/${id}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedId(id);
        toast.success("Tracking link copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Calc top-level stats
    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + (Number(link.totalClicks) || 0), 0);

    const filteredInfluencers = influencerDropdown.filter(inf => {
        const matchesSearch = inf.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (campaignId && campaignId !== 'none') {
            const isInCampaign = collaborations.some(c => c.campaignId.toString() === campaignId && c.influencerId === inf.id);
            return matchesSearch && isInCampaign;
        }
        return matchesSearch;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Top Level Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-brand-50 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-brand-50 to-transparent opacity-50 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Tracking Links</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                            <LinkIcon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-heading text-slate-800">{loading ? "-" : totalLinks}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">Active</span> across campaigns
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-indigo-50 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-indigo-50 to-transparent opacity-50 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Verified Clicks</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                            <MousePointerClick className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-heading text-slate-800">{loading ? "-" : totalClicks}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <Activity className="h-3 w-3 mr-1 text-indigo-500" />
                            Real-time redirect traffic
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-amber-50 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-amber-50 to-transparent opacity-50 pointer-events-none" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Unique Visitors</CardTitle>
                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <UsersIcon className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-heading text-slate-800">{loading ? "-" : (metrics?.uniqueVisitors || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <Eye className="h-3 w-3 mr-1 text-amber-500" />
                            Distinct humans reached
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Traffic Chart */}
            <Card className="border-slate-200/60 shadow-md">
                <CardHeader className="border-b border-slate-50 pb-4">
                    <CardTitle className="text-lg">Click Interactions Over Time</CardTitle>
                    <CardDescription>Aggregate traffic across all your generated Affiliate Links</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 pb-2">
                    <div className="h-[280px] w-full">
                        {loading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                        tickFormatter={(val) => {
                                            // Format YYYY-MM-DD to MMM DD
                                            try { return format(new Date(val), "MMM dd"); } catch { return val; }
                                        }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="totalClicks"
                                        name="Total Clicks"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorClicks)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Device Breakdown */}
                <Card className="border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-slate-700">
                            <Smartphone className="h-4 w-4 text-slate-400" />
                            Device Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
                        ) : (!metrics?.devices || metrics.devices.length === 0) ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No device data yet</p>
                        ) : (
                            <div className="space-y-4 mt-2">
                                {metrics.devices.map((d: any, i: number) => {
                                    const percent = totalClicks > 0 ? Math.round((d.value / totalClicks) * 100) : 0;
                                    return (
                                        <div key={d.name} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="capitalize font-medium text-slate-700">{d.name}</span>
                                                <span className="text-muted-foreground">{percent}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-400' : 'bg-slate-300'}`} 
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Traffic Sources */}
                <Card className="border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-slate-700">
                            <Share2 className="h-4 w-4 text-slate-400" />
                            Traffic Sources
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
                        ) : (!metrics?.referrers || metrics.referrers.length === 0) ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No referrer data yet</p>
                        ) : (
                            <div className="space-y-4 mt-2">
                                {metrics.referrers.map((r: any, i: number) => {
                                    const percent = totalClicks > 0 ? Math.round((r.value / totalClicks) * 100) : 0;
                                    return (
                                        <div key={r.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${r.name === 'Instagram' ? 'bg-pink-500' : r.name === 'YouTube' ? 'bg-red-500' : r.name === 'TikTok' ? 'bg-black' : r.name === 'Direct' ? 'bg-slate-400' : 'bg-blue-400'}`} />
                                                <span className="text-sm font-medium text-slate-700">{r.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900">{r.value}</p>
                                                <p className="text-[10px] text-muted-foreground">{percent}%</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Locations */}
                <Card className="border-slate-200/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-slate-700">
                            <Globe className="h-4 w-4 text-slate-400" />
                            Top Locations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
                        ) : (!metrics?.countries || metrics.countries.length === 0) ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No location data yet</p>
                        ) : (
                            <div className="space-y-3 mt-2">
                                {metrics.countries.slice(0, 5).map((c: any) => (
                                    <div key={c.name} className="flex items-center justify-between border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                        <span className="text-sm font-medium text-slate-700">{c.name}</span>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono text-xs">
                                            {c.value}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Link Generator Tool */}
                <Card className="lg:col-span-1 border-slate-200/60 shadow-md">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6 rounded-t-xl">
                        <CardTitle className="text-lg">Generate Link</CardTitle>
                        <CardDescription>
                            Create a trackable URL to measure influencer traffic.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleCreateLink} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Link Title</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Summer Campaign - John Doe"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">Destination URL <span className="text-destructive">*</span></Label>
                                <Input
                                    id="url"
                                    type="url"
                                    placeholder="https://yourstore.com/product"
                                    value={destinationUrl}
                                    onChange={(e) => setDestinationUrl(e.target.value)}
                                    className="bg-white"
                                    required
                                />
                                <p className="text-[11px] text-muted-foreground">The actual page you want followers to land on.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="campaign">Assign to Campaign (Optional)</Label>
                                <Select value={campaignId} onValueChange={setCampaignId}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Select a Campaign" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None - General Link</SelectItem>
                                        {campaignDropdown.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="influencer">Assign to Influencers (Optional)</Label>
                                <div className="border border-slate-200 rounded-md bg-white overflow-hidden shadow-sm">
                                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                                        <Input
                                            placeholder="Search influencers..."
                                            className="h-8 text-xs bg-white"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="p-2 h-[140px] overflow-y-auto space-y-1">
                                        {filteredInfluencers.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center py-4">No influencers found</p>
                                        ) : (
                                            filteredInfluencers.map(inf => (
                                                <div
                                                    key={inf.id}
                                                    className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer"
                                                    onClick={() => toggleInfluencer(inf.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-slate-300 pointer-events-none"
                                                        checked={selectedInfluencers.includes(inf.id)}
                                                        readOnly
                                                    />
                                                    <span className="text-sm truncate select-none">{inf.name}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-slate-100 bg-slate-50 text-xs text-muted-foreground flex justify-between">
                                        <span>{selectedInfluencers.length} selected</span>
                                        {selectedInfluencers.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedInfluencers([])}
                                                className="text-brand-600 hover:text-brand-700 hover:underline"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>


                            <Button type="submit" size="lg" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md font-semibold" disabled={generating}>
                                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LinkIcon className="w-4 h-4 mr-2" />}
                                Generate Tracking Link
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Existing Links Table */}
                <Card className="lg:col-span-2 border-slate-200/60 shadow-md">
                    <CardHeader className="border-b border-slate-50 pb-4">
                        <CardTitle className="text-lg flex flex-col justify-between">
                            <span>Active Trackers</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4 outline-brand-600" />
                                <p>Loading analytics data...</p>
                            </div>
                        ) : links.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center border-t border-dashed my-4 mx-4 rounded-xl border-slate-200">
                                <LinkIcon className="h-10 w-10 text-slate-300 mb-4" />
                                <h3 className="text-lg font-medium text-slate-900">No links generated yet</h3>
                                <p className="text-slate-500 max-w-sm mt-1">
                                    Create your first tracking link using the generator panel to start measuring campaign ROI.
                                </p>
                            </div>
                        ) : (
                            <Accordion type="multiple" className="w-full">
                                {links.map((masterLink, index) => (
                                    <AccordionItem key={index} value={`item-${index}`} className="border-b-0 border-t border-slate-100 first:border-t-0 px-4">
                                        <AccordionTrigger className="hover:no-underline py-4">
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <div className="space-y-1 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-slate-900 leading-tight">{masterLink.title}</h4>
                                                        {masterLink.campaignTitle && (
                                                            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-600 border-indigo-200">
                                                                🎯 {masterLink.campaignTitle}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center text-xs text-muted-foreground gap-4">
                                                        <span className="flex items-center truncate max-w-[200px]" title={masterLink.destinationUrl}>
                                                            <LinkIcon className="h-3 w-3 mr-1" />
                                                            {masterLink.destinationUrl}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Calendar className="h-3 w-3 mr-1" />
                                                            {format(new Date(masterLink.createdAt), "MMM d, yyyy")}
                                                        </span>
                                                        <span className="flex items-center text-brand-700 font-medium bg-brand-50 px-2 py-0.5 rounded-full">
                                                            <Users className="h-3 w-3 mr-1" />
                                                            {masterLink.children.length} Influencers
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-center px-4 py-1.5 bg-slate-50 rounded-lg border border-slate-100 shadow-sm min-w-[80px]">
                                                    <p className="text-xl font-bold font-heading tracking-tight text-slate-800 leading-none">{masterLink.totalClicks || 0}</p>
                                                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mt-1">Total</p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-4 pt-1">
                                            <div className="space-y-2 pl-4 border-l-2 border-slate-100 ml-2">
                                                {masterLink.children.map((child: any) => (
                                                    <div key={child.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                                                <span className="text-xs font-bold text-slate-600">
                                                                    {child.influencerName.charAt(0)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900 leading-none">{child.influencerName}</p>
                                                                <p className="text-[10px] text-muted-foreground mt-1 font-mono">{child.id}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-slate-800">{child.clicksCount}</p>
                                                                <p className="text-[10px] text-muted-foreground">Clicks</p>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    copyToClipboard(child.id);
                                                                }}
                                                                className="h-8 w-8 bg-white"
                                                            >
                                                                {copiedId === child.id ? (
                                                                    <Check className="h-4 w-4 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* --- Leaderboards Row --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">

                {/* Top Influencers Leaderboard */}
                <Card className="border-slate-200/60 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Top Performing Influencers
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            {(() => {
                                // Calculate Top Influencers across all Master Links
                                const infMap = new Map<string, number>();
                                links.forEach(master => {
                                    master.children?.forEach((child: any) => {
                                        const current = infMap.get(child.influencerName) || 0;
                                        infMap.set(child.influencerName, current + child.clicksCount);
                                    });
                                });
                                const sortedInfs = Array.from(infMap.entries())
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 3);

                                if (sortedInfs.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>;

                                return sortedInfs.map(([name, clicks], idx) => (
                                    <div key={name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' :
                                                idx === 1 ? 'bg-slate-200 text-slate-700' :
                                                    'bg-amber-50/50 text-amber-900/50 border border-amber-100'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            <span className="font-medium text-sm text-slate-800">{name}</span>
                                        </div>
                                        <Badge variant="secondary" className="font-mono bg-white border-slate-200">
                                            {clicks} clicks
                                        </Badge>
                                    </div>
                                ));
                            })()}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Campaigns Leaderboard */}
                <Card className="border-slate-200/60 shadow-sm bg-gradient-to-br from-white to-slate-50/50">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Medal className="h-4 w-4 text-brand-600" />
                            Top Performing Campaigns
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-4">
                            {(() => {
                                const campMap = new Map<string, number>();
                                links.forEach(master => {
                                    if (master.campaignTitle) {
                                        const current = campMap.get(master.campaignTitle) || 0;
                                        campMap.set(master.campaignTitle, current + master.totalClicks);
                                    }
                                });
                                const sortedCamps = Array.from(campMap.entries())
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 3);

                                if (sortedCamps.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>;

                                return sortedCamps.map(([title, clicks], idx) => (
                                    <div key={title} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded flex items-center justify-center text-xs font-bold bg-brand-50 text-brand-600">
                                                #{idx + 1}
                                            </div>
                                            <span className="font-medium text-sm text-slate-800 truncate max-w-[180px]">{title}</span>
                                        </div>
                                        <Badge variant="outline" className="font-mono bg-brand-50 text-brand-700 border-brand-200">
                                            {clicks} clicks
                                        </Badge>
                                    </div>
                                ));
                            })()}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
