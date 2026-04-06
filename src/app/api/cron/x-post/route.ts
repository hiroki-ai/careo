import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateXPost } from "@/lib/x/generatePost";
import { postToX } from "@/lib/x/postToX";
import { type Pillar, selectPillar } from "@/lib/x/character";

export const maxDuration = 30;

// Vercel Cron: 8時/12時/21時（JST）
// vercel.json に追加:
//   { "path": "/api/cron/x-post", "schedule": "0 23 * * *" }  // 8時JST（前日23時UTC）
//   { "path": "/api/cron/x-post", "schedule": "0 3 * * *"  }  // 12時JST
//   { "path": "/api/cron/x-post", "schedule": "0 12 * * *" }  // 21時JST

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // pillarOverride: クエリパラメータで強制指定可能（例: ?pillar=question）
  const pillarParam = req.nextUrl.searchParams.get("pillar") as Pillar | null;
  const validPillars: Pillar[] = ["info", "empathy", "question", "careo", "trend"];
  const pillarOverride = pillarParam && validPillars.includes(pillarParam) ? pillarParam : undefined;

  // 質問型投稿の週2〜3回ルール: 直近7日のx_posts履歴を確認
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let finalPillar = pillarOverride;

  if (!finalPillar) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentPosts } = await supabase
      .from("x_posts")
      .select("pillar, posted_at")
      .gte("posted_at", weekAgo)
      .order("posted_at", { ascending: false });

    const recentQuestionCount = (recentPosts ?? []).filter((p) => p.pillar === "question").length;

    // 質問型が週2回未満なら優先的に選ぶ（ランダム50%の確率で）
    if (recentQuestionCount < 2 && Math.random() < 0.5) {
      finalPillar = "question";
    } else {
      finalPillar = selectPillar();
    }
  }

  const generated = await generateXPost(finalPillar);
  const { id, url } = await postToX(generated.text);

  // 投稿ログをSupabaseに保存（x_postsテーブル）
  await supabase.from("x_posts").insert({
    tweet_id: id,
    text: generated.text,
    pillar: generated.pillar,
    url,
    posted_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, id, url, pillar: generated.pillar, text: generated.text });
}
