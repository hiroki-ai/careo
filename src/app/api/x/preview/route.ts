import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/x/generatePost";
import type { PostPillar } from "@/lib/x/character";
import { postToX } from "@/lib/x/postToX";

// 投稿プレビュー & 手動投稿 API
// GET /api/x/preview?pillar=empathy        → 生成のみ（投稿しない）
// POST /api/x/preview?pillar=empathy&post=1 → 生成 + 実際に投稿

const VALID_PILLARS: PostPillar[] = ["empathy", "target", "trend", "developer", "feature"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pillar = searchParams.get("pillar") as PostPillar | null;

  if (pillar && !VALID_PILLARS.includes(pillar)) {
    return NextResponse.json(
      { error: `Invalid pillar. Valid: ${VALID_PILLARS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const post = await generatePost(pillar ?? undefined);
    return NextResponse.json({
      pillar: post.pillar,
      text: post.text,
      hashtags: post.hashtags,
      fullText: post.fullText,
      charCount: post.fullText.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pillar = searchParams.get("pillar") as PostPillar | null;
  const shouldPost = searchParams.get("post") === "1";

  try {
    const post = await generatePost(pillar ?? undefined);

    if (!shouldPost) {
      return NextResponse.json({
        pillar: post.pillar,
        fullText: post.fullText,
        charCount: post.fullText.length,
        posted: false,
        message: "プレビューのみ。?post=1 を付けると実際に投稿します",
      });
    }

    const result = await postToX(post.fullText);
    return NextResponse.json({
      pillar: post.pillar,
      fullText: post.fullText,
      posted: result.success,
      tweetId: result.tweetId,
      url: result.url,
      error: result.error,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
