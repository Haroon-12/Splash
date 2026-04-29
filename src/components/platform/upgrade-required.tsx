"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Crown } from "lucide-react";
import { useRouter } from "next/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";

interface UpgradeRequiredProps {
  title?: string;
  description: string;
  buttonText?: string;
  withLayout?: boolean;
}

export function UpgradeRequired({ 
  title = "Upgrade Required", 
  description, 
  buttonText = "View Plans",
  withLayout = false
}: UpgradeRequiredProps) {
  const router = useRouter();

  const content = (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto flex flex-col items-center justify-center">
      <Card className="border-amber-500 bg-amber-500/10 w-full shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-500 text-2xl">
            <ShieldAlert className="w-6 h-6" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700/80 dark:text-amber-500/80 text-lg">
            {description}
          </p>
        </CardContent>
        <div className="p-6 pt-0">
          <Button onClick={() => router.push("/billing")} className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto">
            <Crown className="w-4 h-4 mr-2" />
            {buttonText}
          </Button>
        </div>
      </Card>
    </div>
  );

  if (withLayout) {
    return <PlatformLayout>{content}</PlatformLayout>;
  }

  return content;
}
