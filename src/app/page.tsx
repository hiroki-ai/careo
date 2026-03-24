import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";
import { MobileLandingPage } from "@/components/landing/MobileLandingPage";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return <DashboardContent />;
  }

  const headersList = await headers();
  const ua = headersList.get("user-agent") ?? "";
  const isMobile = /iPhone|Android|Mobile/i.test(ua);

  return isMobile ? <MobileLandingPage /> : <LandingPage />;
}
