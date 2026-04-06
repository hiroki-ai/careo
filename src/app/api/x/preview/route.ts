import { NextRequest, NextResponse } from "next/server";
import { generateXPost } from "@/lib/x/generatePost";
import { postToX } from "@/lib/x/postToX";
import { type Pillar } from "@/lib/x/character";

export const maxDuration = 30;

// GET  /api/x/preview?secret=xxx&pillar=question  → プレビューのみ（投稿しない）
// POST /api/x/preview?secret=xxx&post=1&pillar=question → 実際に投稿

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pillarParam = req.nextUrl.searchParams.get("pillar") as Pillar | null;
  const validPillars: Pillar[] = ["info", "empathy", "question", "careo", "trend"];
  const pillarOverride = pillarParam && validPillars.includes(pillarParam) ? pillarParam : undefined;

  const generated = await generateXPost(pillarOverride);
  return NextResponse.json({ preview: true, pillar: generated.pillar, text: generated.text });
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shouldPost = req.nextUrl.searchParams.get("post") === "1";
  const pillarParam = req.nextUrl.searchParams.get("pillar") as Pillar | null;
  const validPillars: Pillar[] = ["info", "empathy", "question", "careo", "trend"];
  const pillarOverride = pillarParam && validPillars.includes(pillarParam) ? pillarParam : undefined;

  const generated = await generateXPost(pillarOverride);

  if (!shouldPost) {
    return NextResponse.json({ preview: true, pillar: generated.pillar, text: generated.text });
  }

  const { id, url } = await postToX(generated.text);
  return NextResponse.json({ posted: true, id, url, pillar: generated.pillar, text: generated.text });
}
