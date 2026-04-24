import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { GLOSSARY } from "@/data/glossary";
import { UNIVERSITY_LPS } from "@/data/universities-lp";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://careoai.jp",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    { url: "https://careoai.jp/diagnosis", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://careoai.jp/simulator", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://careoai.jp/stats", lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    { url: "https://careoai.jp/summer-intern", lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: "https://careoai.jp/glossary", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
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

    const glossaryPages: MetadataRoute.Sitemap = GLOSSARY.map((t) => ({
      url: `https://careoai.jp/glossary/${t.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    const universityPages: MetadataRoute.Sitemap = UNIVERSITY_LPS.map((u) => ({
      url: `https://careoai.jp/for/${u.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...blogPages, ...glossaryPages, ...universityPages];
  } catch {
    return staticPages;
  }
}
