"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Instagram, Youtube, Facebook, Mail as MailIcon, ArrowLeft } from "lucide-react";

type DirectoryInfluencer = {
  name: string;
  category: string | null;
  socials: {
    instagram: string | null;
    youtube: string | null;
    facebook: string | null;
    tiktok: string | null;
  };
  imageUrl: string | null;
  description: string | null;
  previousBrands: string | null;
  gender: string | null;
  email: string | null;
  isPlatformUser: boolean;
  platformUserId: string | null;
  platformImage: string | null;
};

export default function ExternalInfluencerProfilePage() {
  const params = useParams<{ email: string }>();
  const router = useRouter();
  const [data, setData] = useState<DirectoryInfluencer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const param = decodeURIComponent(params.email);
        const isEmail = param.includes('@');
        const query = isEmail ? `email=${encodeURIComponent(param)}` : `name=${encodeURIComponent(param)}`;
        const res = await fetch(`/api/directory/influencers?${query}`);
        const list = await res.json();
        setData(list[0] || null);
      } finally {
        setLoading(false);
      }
    };
    if (params.email) load();
  }, [params.email]);

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PlatformLayout>
    );
  }

  if (!data) {
    return (
      <PlatformLayout>
        <div className="p-6 max-w-3xl mx-auto">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          <p className="text-muted-foreground">Profile not found.</p>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20 lg:h-24 lg:w-24">
                <AvatarImage src={data.platformImage || data.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${data.name}`} alt={data.name} />
                <AvatarFallback className="text-2xl">{data.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <CardTitle className="text-2xl lg:text-3xl">{data.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">External</Badge>
                    {data.category && (
                      <Badge variant="outline" className="capitalize">{data.category}</Badge>
                    )}
                  </div>
                </div>

                {data.email && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MailIcon className="w-4 h-4" />
                    <a className="underline" href={`mailto:${data.email}`}>{data.email}</a>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {data.socials.instagram && (
                    <a aria-label="Instagram" title="Instagram" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] text-white shadow-sm hover:opacity-90" href={data.socials.instagram} target="_blank" rel="noreferrer">
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {data.socials.youtube && (
                    <a aria-label="YouTube" title="YouTube" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FF0000] text-white shadow-sm hover:opacity-90" href={data.socials.youtube} target="_blank" rel="noreferrer">
                      <Youtube className="h-4 w-4" />
                    </a>
                  )}
                  {data.socials.facebook && (
                    <a aria-label="Facebook" title="Facebook" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm hover:opacity-90" href={data.socials.facebook} target="_blank" rel="noreferrer">
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {data.socials.tiktok && (
                    <a aria-label="TikTok" title="TikTok" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-sm hover:opacity-90" href={data.socials.tiktok} target="_blank" rel="noreferrer">
                      <span className="text-[11px] leading-none">TT</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {data.description && (
              <div>
                <h3 className="font-medium mb-1">About</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{data.description}</p>
              </div>
            )}

            {data.previousBrands && (
              <div>
                <h3 className="font-medium mb-1">Previous Brands</h3>
                <p className="text-sm text-muted-foreground">{data.previousBrands}</p>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                This influencer hasn't created an account yet. You can view public details and contact via email. To message within the platform, ask them to sign up.
              </p>
            </div>

            {data.email && (
              <div>
                <Button onClick={() => window.open(`mailto:${data.email}`, '_blank')} className="mt-2">
                  <MailIcon className="h-4 w-4 mr-2" /> Contact via Email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}


