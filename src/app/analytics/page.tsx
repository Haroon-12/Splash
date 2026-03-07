import { redirect } from "next/navigation";

export default function AnalyticsRedirectPage() {
  // Legacy route redirection
  redirect("/dashboard/analytics");
}