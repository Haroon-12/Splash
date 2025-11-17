"use client";

import { PlatformLayout } from "@/components/platform/platform-layout";
import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  Wand2,
  Download,
  Share2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AdGenerationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userType = (session?.user as any)?.userType;
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    tone: "professional",
    platform: "instagram",
    adType: "image",
  });
  const [generatedAd, setGeneratedAd] = useState<any>(null);

  // Redirect influencers away from this page
  if (userType !== "brand") {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Brand Feature Only</h2>
            <p className="text-muted-foreground">
              Ad generation is only available for brand accounts. This feature helps brands create marketing content for their campaigns.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </PlatformLayout>
    );
  }

  const handleGenerate = async () => {
    if (!formData.productName || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);

    // Simulate AI generation (will be replaced with actual API call)
    setTimeout(() => {
      setGeneratedAd({
        type: formData.adType,
        content: `🚀 Introducing ${formData.productName}!\n\n${formData.description}\n\n✨ Limited time offer - Get yours today!\n\n#${formData.productName.replace(/ /g, "")} #Marketing #Innovation`,
        imageUrl: "https://via.placeholder.com/800x800?text=Generated+Ad",
        timestamp: new Date().toISOString(),
      });
      setIsGenerating(false);
      toast.success("Ad generated successfully!");
    }, 3000);
  };

  const handleCopy = () => {
    if (generatedAd) {
      navigator.clipboard.writeText(generatedAd.content);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <PlatformLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-2">AI Ad Generation</h1>
          <p className="text-muted-foreground text-lg">
            Create professional marketing content in seconds
          </p>
        </motion.div>

        {/* Usage Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 mb-1">Ad Generations This Month</p>
              <p className="text-3xl font-bold">0 / 5</p>
              <p className="text-sm text-white/80 mt-1">
                Free plan - Resets in 30 days
              </p>
            </div>
            <Sparkles className="w-12 h-12 text-white/50" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card rounded-2xl p-6 border border-border space-y-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create Your Ad</h2>
                <p className="text-sm text-muted-foreground">
                  Fill in the details below
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product/Service Name *</Label>
                <Input
                  id="productName"
                  placeholder="e.g., Premium Coffee Blend"
                  value={formData.productName}
                  onChange={(e) =>
                    setFormData({ ...formData, productName: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product, its benefits, target audience..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) =>
                      setFormData({ ...formData, platform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ad Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={formData.adType === "image" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, adType: "image" })}
                    className="flex flex-col items-center gap-2 h-auto py-3"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-xs">Image</span>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.adType === "video" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, adType: "video" })}
                    className="flex flex-col items-center gap-2 h-auto py-3"
                  >
                    <Video className="w-5 h-5" />
                    <span className="text-xs">Video</span>
                  </Button>
                  <Button
                    type="button"
                    variant={formData.adType === "text" ? "default" : "outline"}
                    onClick={() => setFormData({ ...formData, adType: "text" })}
                    className="flex flex-col items-center gap-2 h-auto py-3"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-xs">Text</span>
                  </Button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Ad
                </>
              )}
            </Button>
          </motion.div>

          {/* Preview/Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h2 className="text-xl font-bold mb-4">Preview</h2>

            {!generatedAd ? (
              <div className="flex items-center justify-center h-[500px] border-2 border-dashed border-border rounded-xl">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    Your generated ad will appear here
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Generated Image Preview */}
                {generatedAd.type === "image" && (
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <img
                      src={generatedAd.imageUrl}
                      alt="Generated Ad"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Generated Text */}
                <div className="bg-muted p-4 rounded-xl">
                  <p className="text-sm whitespace-pre-wrap">
                    {generatedAd.content}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCopy}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>

                {/* Regenerate */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerate}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Recent Ads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h2 className="text-xl font-bold mb-4">Recent Ads</h2>
          <div className="text-center py-8 text-muted-foreground">
            No ads generated yet. Create your first ad above!
          </div>
        </motion.div>
      </div>
    </PlatformLayout>
  );
}