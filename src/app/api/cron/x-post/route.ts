import { NextRequest, NextResponse } from "next/server";
import { generatePost } from "@/lib/x/generatePost";
import { postToX } from "@/lib/x/postToX";

// Vercel Cron から呼ばれる（1日3回: 8時/12時/21時 JST）
// vercel.json で設定: "0 23,3,12 * * *" (UTC)
export async function GET(request: NextRequest) {
  // Vercel Cron の認証チェック
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const post = await generatePost();

    console.log(`[x-post] pillar: ${post.pillar}`);
    console.log(`[x-post] text: ${post.fullText}`);

    const result = await postToX(post.fullText);

    if (!result.success) {
      console.error("[x-post] failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    console.log(`[x-post] posted: ${result.url}`);
    return NextResponse.json({
      success: true,
      pillar: post.pillar,
      tweetId: result.tweetId,
      url: result.url,
      preview: post.fullText,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[x-post] unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
