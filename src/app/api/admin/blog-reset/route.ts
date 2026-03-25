import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

// POST /api/admin/blog-reset?secret=xxx&slug=yyy
// 指定スラッグの記事を削除してから /api/cron/blog-post?force=1 を呼び出す

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: delErr } = await supabase
    .from("blog_posts")
    .delete()
    .eq("slug", slug);

  if (delErr) {
    return NextResponse.json({ error: "delete failed", detail: delErr }, { status: 500 });
  }

  // 削除後に新記事を生成
  const origin = req.nextUrl.origin;
  const cronRes = await fetch(
    `${origin}/api/cron/blog-post?secret=${process.env.CRON_SECRET}&force=1`,
    { headers: { "x-cron-secret": process.env.CRON_SECRET! } }
  );
  const cronJson = await cronRes.json();

  return NextResponse.json({ deleted: slug, generated: cronJson });
}
