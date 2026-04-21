import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600; // 1時間ごとに再取得（ブログ新着を反映）
import { LandingPage } from "@/components/landing/LandingPage";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export type RecentPost = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  reading_time_min: number;
  published_at: string;
};

export type UserReview = {
  id: string;
  quote: string;
  display_name: string;
  university: string | null;
  rating: number;
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

async function getApprovedReviews(): Promise<UserReview[]> {
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("user_reviews")
      .select("id, quote, display_name, university, rating")
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(9);
    return data ?? [];
  } catch {
    return [];
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

  const [recentPosts, userCount, reviews] = await Promise.all([
    getRecentPosts(),
    getUserCount(),
    getApprovedReviews(),
  ]);

  return <LandingPage recentPosts={recentPosts} userCount={userCount} reviews={reviews} />;
}
