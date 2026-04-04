import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600; // 1時間ごとに再取得（ブログ新着を反映）
import { LandingPage } from "@/components/landing/LandingPage";
import { MobileLandingPage } from "@/components/landing/MobileLandingPage";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export type RecentPost = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  reading_time_min: number;
  published_at: string;
};

async function getUserCount(): Promise<number> {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { count } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function getRecentPosts(): Promise<RecentPost[]> {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, tags, reading_time_min, published_at")
      .order("published_at", { ascending: false })
      .limit(3);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return <DashboardContent />;
  }

  const [headersList, recentPosts, userCount] = await Promise.all([
    headers(),
    getRecentPosts(),
    getUserCount(),
  ]);
  const ua = headersList.get("user-agent") ?? "";
  const isMobile = /iPhone|Android|Mobile/i.test(ua);

  return isMobile
    ? <MobileLandingPage recentPosts={recentPosts} userCount={userCount} />
    : <LandingPage recentPosts={recentPosts} userCount={userCount} />;
}
