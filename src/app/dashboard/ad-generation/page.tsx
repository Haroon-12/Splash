"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Sparkles, Upload, Wand2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdGenerationPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  // Redirect influencers to dashboard
  useEffect(() => {
    if (session?.user?.userType === "influencer") {
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

  if (!session?.user || session.user.userType !== "brand") {
    return null;
  }

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate ad generation - will integrate with AI service later
    setTimeout(() => {
      setGeneratedAd("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=800&fit=crop");
      setIsGenerating(false);
    }, 3000);
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
            Create stunning marketing ads powered by AI in seconds
          </p>
        </div>

        {/* Usage Stats */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Ad Creation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Create Your Ad</CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Fill in the details and let AI generate professional ads for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6">
              <Tabs defaultValue="text">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="text-xs lg:text-sm">Text-to-Ad</TabsTrigger>
                  <TabsTrigger value="image" className="text-xs lg:text-sm">Image-to-Ad</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-3 lg:space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign" className="text-xs lg:text-sm">Campaign Name</Label>
                    <Input id="campaign" placeholder="Summer Sale 2025" className="text-sm lg:text-base" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs lg:text-sm">Ad Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your product, target audience, and key message..."
                      rows={4}
                      className="text-sm lg:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style" className="text-xs lg:text-sm">Ad Style</Label>
                    <Select>
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
                    <Select>
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
                </TabsContent>

                <TabsContent value="image" className="space-y-3 lg:space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="upload" className="text-xs lg:text-sm">Upload Reference Image</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 lg:p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="h-10 w-10 lg:h-12 lg:w-12 mx-auto mb-3 lg:mb-4 text-muted-foreground" />
                      <p className="text-xs lg:text-sm text-muted-foreground">
                        Drag & drop an image or click to browse
                      </p>
                      <Input id="upload" type="file" className="hidden" accept="image/*" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-xs lg:text-sm">Enhancement Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="How should we enhance or modify this image?"
                      rows={3}
                      className="text-sm lg:text-base"
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
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Ad
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg lg:text-xl">Preview</CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Your generated ad will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedAd ? (
                <div className="space-y-3 lg:space-y-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={generatedAd}
                      alt="Generated ad"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2 text-sm lg:text-base">
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 text-sm lg:text-base">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                  <div className="text-center p-4">
                    <Sparkles className="h-12 w-12 lg:h-16 lg:w-16 mx-auto mb-3 lg:mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Fill in the form and click Generate to see your ad
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Generations */}
        <Card className="mt-6 lg:mt-8">
          <CardHeader>
            <CardTitle className="text-lg lg:text-xl">Recent Generations</CardTitle>
            <CardDescription className="text-xs lg:text-sm">Your previously generated ads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No ads generated yet. Create your first ad above!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}