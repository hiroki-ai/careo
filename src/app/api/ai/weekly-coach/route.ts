import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MOOD_LABELS: Record<string, string> = {
  good: "😊楽しかった",
  nervous: "😤緊張した",
  hot: "🔥手応えあり",
  tired: "😴疲れた",
  neutral: "😶普通",
};

export async function POST(req: NextRequest) {
  const { allowed } = checkRateLimit(getClientIp(req), "weekly-coach");
  if (!allowed) {
    return NextResponse.json({ error: "リクエストが多すぎます。しばらく後に再試行してください。" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      companies = [], esList = [], interviews = [],
      profile = null, obVisits = [], aptitudeTests = [],
    } = body;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentInterviews = interviews.filter(
      (i: { scheduledAt: string; mood?: string; result: string }) =>
        new Date(i.scheduledAt) >= oneWeekAgo
    );
    const moodSummary = recentInterviews
      .filter((i: { mood?: string }) => i.mood)
      .map((i: { round: number; mood: string; result: string }) =>
        `${i.round}次面接: ${MOOD_LABELS[i.mood] ?? i.mood}（結果: ${i.result === "PASS" ? "通過" : i.result === "FAIL" ? "不通過" : "結果待ち"}）`
      ).join(", ");

    const offered = companies.filter((c: { status: string }) => c.status === "OFFERED").length;
    const active = companies.filter((c: { status: string }) => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status)).length;
    const gradYear = profile?.graduationYear ?? 2028;
    const monthsLeft = (gradYear - now.getFullYear()) * 12 + (3 - (now.getMonth() + 1));

    const lines = [
      `[ユーザー] ${profile ? `${profile.university || ""} ${gradYear}年卒 / 志望:${profile.targetIndustries?.join("・") || "未設定"}` : "未設定"}`,
      `[就活データ] 企業${companies.length}社(選考中${active}/内定${offered}/不採用${companies.filter((c: { status: string }) => c.status === "REJECTED").length}) ES${esList.length}件 面接${interviews.length}件 OB訪問${obVisits.length}件 筆記${aptitudeTests.length}件`,
      `[今週の面接] ${recentInterviews.length}件${moodSummary ? ` / 感情: ${moodSummary}` : ""}`,
      profile?.careerAxis ? `[就活の軸] ${String(profile.careerAxis).slice(0, 100)}` : "",
      profile?.strengths ? `[強み] ${String(profile.strengths).slice(0, 60)}` : "",
      `[時期] 卒業まで約${monthsLeft}ヶ月`,
    ].filter(Boolean).join("\n");

    const prompt = `就活コーチとして、この就活生の先週の振り返りと今週のアドバイスをJSONのみで返してください。

${lines}

{"reflection":{"summary":"先週の全体評価（2〜3文）","moodAnalysis":"面接の感情パターンから読み取れること（感情データがない場合は省略可）","highlights":["頑張ったこと1","頑張ったこと2"],"challenges":["課題1","課題2"]},"thisWeek":{"focus":"今週の最優先テーマ（20字以内）","actions":["具体的アクション1","具体的アクション2","具体的アクション3"],"encouragement":"個人に向けた前向きな一言（50字以内）"},"insight":"就活全体を通じた気づき・アドバイス（2文）"}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text"
      ? message.content[0].text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim()
      : "{}";
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);
    return NextResponse.json(json);
  } catch (err) {
    console.error("[weekly-coach]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
