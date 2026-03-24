import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://careoai.jp",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://careoai.jp/blog",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://careoai.jp/compare",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://careoai.jp/login",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://careoai.jp/signup",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://careoai.jp/for-career-center",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: "https://careoai.jp/features",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, published_at")
      .order("published_at", { ascending: false })
      .limit(200);

    const blogPages: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
      url: `https://careoai.jp/blog/${p.slug}`,
      lastModified: new Date(p.published_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...blogPages];
  } catch {
    return staticPages;
  }
}
