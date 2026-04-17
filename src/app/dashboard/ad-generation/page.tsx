"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Sparkles, Upload, Wand2, Download, Eye, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function AdGenerationPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // API State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<{
    imageUrl: string;
    taglines: string[];
    caption: string;
    hashtags: string[];
  } | null>(null);

  // Form State
  const [activeTab, setActiveTab] = useState("text");
  const [campaign, setCampaign] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState("");
  const [platform, setPlatform] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if ((session?.user as any)?.userType === "influencer") {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (isPending) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!session?.user || (session.user as any).userType !== "brand") {
    return null;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageBase64(reader.result as string);
        toast.success("Image uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    // Basic validation
    if (activeTab === "text" && !description) {
      toast.error("Please enter an ad description");
      return;
    }
    if (activeTab === "image" && !uploadedImageBase64) {
      toast.error("Please upload a reference image for Image-to-Ad");
      return;
    }

    setIsGenerating(true);
    setGeneratedData(null);

    try {
      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign,
          description: activeTab === "text" ? description : undefined,
          prompt: activeTab === "image" ? imagePrompt : undefined,
          base64Image: activeTab === "image" ? uploadedImageBase64 : undefined,
          style,
          platform
        })
      });

      if (!response.ok) throw new Error("Failed to generate ad");

      const data = await response.json();
      setGeneratedData(data);
      toast.success("Ad creatives generated successfully!");

    } catch (error) {
      console.error(error);
      toast.error("An error occurred during generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const handleDownload = () => {
    if (!generatedData?.imageUrl) return;

    // For base64 we can trigger download directly, for URLs we fetch to blob
    if (generatedData.imageUrl.startsWith('data:')) {
      const a = document.createElement("a");
      a.href = generatedData.imageUrl;
      a.download = `${campaign ? campaign.replace(/\s+/g, '_').toLowerCase() : 'splash'}_ad_creative.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      fetch(generatedData.imageUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${campaign ? campaign.replace(/\s+/g, '_').toLowerCase() : 'splash'}_ad_creative.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        });
    }
  };

  const handlePreview = () => {
    if (!generatedData?.imageUrl) return;
    const win = window.open();
    win?.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#0f172a;height:100vh;"><img src="${generatedData.imageUrl}" style="max-width:100%;max-height:100%;object-fit:contain;"/></body></html>`);
  };

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-2 lg:gap-3 mb-2">
            <Sparkles className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold">AI Ad Generation</h1>
          </div>
          <p className="text-sm lg:text-base text-muted-foreground">
            Create stunning marketing ads and textual creatives powered by FLUX.2 and Gemini.
          </p>
        </div>

        {/* Usage Stats (Simulated) / Hidden for now */}
        {/*
        <Card className="mb-6 lg:mb-8 bg-gradient-to-r from-primary/10 to-accent/10">
          <CardHeader className="pb-3 lg:pb-6">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Wand2 className="h-4 w-4 lg:h-5 lg:w-5" />
              Your Ad Generation Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:gap-4">
              <div className="flex-shrink-0">
                <p className="text-2xl lg:text-3xl font-bold">5</p>
                <p className="text-xs lg:text-sm text-muted-foreground">Ads Generated This Month</p>
              </div>
              <div className="flex-1">
                <div className="w-full bg-muted rounded-full h-2.5 lg:h-3">
                  <div className="bg-primary h-2.5 lg:h-3 rounded-full" style={{ width: "50%" }}></div>
                </div>
              </div>
              <Badge variant="outline" className="text-sm lg:text-lg px-3 py-1.5 lg:px-4 lg:py-2 w-fit">
                Free Plan: 5/10 Used
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-3 lg:mt-4">
              Upgrade to Pro ($25/month) for 10 ads or Premium ($60/month) for unlimited generation
            </p>
          </CardContent>
        </Card>
        */}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 lg:gap-8">
          {/* Ad Creation Form */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Create Your Ad</CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Fill in the details and let AI generate professional ads for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">

              <div className="space-y-2">
                <Label htmlFor="campaign" className="text-xs lg:text-sm">Campaign Name</Label>
                <Input
                  id="campaign"
                  placeholder="Summer Sale 2025"
                  className="text-sm lg:text-base"
                  value={campaign}
                  onChange={e => setCampaign(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="style" className="text-xs lg:text-sm">Ad Style</Label>
                  <Select onValueChange={setStyle} value={style}>
                    <SelectTrigger id="style" className="text-sm lg:text-base">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">Modern & Minimalist</SelectItem>
                      <SelectItem value="vibrant">Vibrant & Colorful</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="playful">Playful & Fun</SelectItem>
                      <SelectItem value="luxury">Luxury & Elegant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform" className="text-xs lg:text-sm">Platform</Label>
                  <Select onValueChange={setPlatform} value={platform}>
                    <SelectTrigger id="platform" className="text-sm lg:text-base">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram Post</SelectItem>
                      <SelectItem value="instagram-story">Instagram Story</SelectItem>
                      <SelectItem value="facebook">Facebook Ad</SelectItem>
                      <SelectItem value="youtube">YouTube Thumbnail</SelectItem>
                      <SelectItem value="twitter">Twitter/X Post</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <Tabs defaultValue="text" onValueChange={setActiveTab} value={activeTab}>
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="text" className="text-xs lg:text-sm">Text-to-Ad</TabsTrigger>
                  {/* <TabsTrigger value="image" className="text-xs lg:text-sm">Image-to-Ad</TabsTrigger> */}
                </TabsList>

                <TabsContent value="text" className="space-y-3 lg:space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs lg:text-sm">Visual Idea & Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your product, target audience, and key visual scene..."
                      rows={4}
                      className="text-sm lg:text-base"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-3 lg:space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-xs lg:text-sm">Upload Product Image</Label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-6 lg:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer ${uploadedImageBase64 ? 'border-green-500 bg-green-50/10' : 'border-border'}`}
                    >
                      {uploadedImageBase64 ? (
                        <div className="flex flex-col items-center">
                          <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                          <p className="text-sm font-medium text-green-600">Image Successfully Loaded</p>
                          <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 lg:h-12 lg:w-12 mx-auto mb-3 lg:mb-4 text-muted-foreground" />
                          <p className="text-xs lg:text-sm text-muted-foreground">
                            Drag & drop an image or click to browse
                          </p>
                        </>
                      )}
                      <Input ref={fileInputRef} type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-xs lg:text-sm">Enhancement Prompt (FLUX.2)</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g. Place this product on a neon cyberpunk street with cinematic lighting..."
                      rows={3}
                      className="text-sm lg:text-base"
                      value={imagePrompt}
                      onChange={e => setImagePrompt(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full gap-2 text-sm lg:text-base"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Running FLUX.2 & Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Ad & Copy
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Preview Panel */}
          <Card className="h-fit flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl flex justify-between items-center">
                <span>Final Output</span>
                {generatedData && <Badge className="bg-green-500">Ready</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              {generatedData ? (
                <>
                  {/* Image Generation Output */}
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">1. Visual Creative (FLUX.2)</Label>
                    <div className="relative w-full aspect-square md:aspect-video lg:aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border">
                      <img
                        src={generatedData.imageUrl}
                        alt="Generated AI ad"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-2 text-sm" onClick={handlePreview}>
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2 text-sm" onClick={handleDownload}>
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {/* Text Generation Output */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">2. Marketing Copy (Gemini 2.5)</Label>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold">Catchy Taglines:</p>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleCopy(generatedData.taglines.join('\n'), 'Taglines')}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <Textarea
                        className="text-sm text-slate-700 dark:text-slate-300 min-h-[80px]"
                        value={generatedData.taglines.join('\n')}
                        onChange={(e) => setGeneratedData({ ...generatedData, taglines: e.target.value.split('\n') })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold">Social Media Caption:</p>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleCopy(generatedData.caption, 'Caption')}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <Textarea
                        className="text-sm italic min-h-[100px]"
                        value={generatedData.caption}
                        onChange={(e) => setGeneratedData({ ...generatedData, caption: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold">Trending Hashtags:</p>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleCopy(generatedData.hashtags.join(' '), 'Hashtags')}>
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <Input
                        value={generatedData.hashtags.join(' ')}
                        onChange={(e) => setGeneratedData({ ...generatedData, hashtags: e.target.value.split(' ') })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed">
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-sm max-w-[200px]">AI models are currently painting your image and writing your copy. Please wait...</p>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-12 w-12 lg:h-16 lg:w-16 mb-4 text-slate-300 dark:text-slate-700" />
                      <p className="text-sm">
                        Fill in the form and click Generate to see your ad creative text and visuals magically appear here!
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformLayout>
  );
}