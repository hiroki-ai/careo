import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "pdca");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      companies = [], esList = [], interviews = [],
      profile = null, pendingActions = [], completedActions = [],
      obVisits = [], aptitudeTests = [],
    } = body;

    const offered = companies.filter((c: { status: string }) => c.status === "OFFERED");
    const active = companies.filter((c: { status: string }) => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status));
    const passedInterviews = interviews.filter((i: { result: string }) => i.result === "PASS").length;
    const failedInterviews = interviews.filter((i: { result: string }) => i.result === "FAIL").length;
    const now = new Date();
    const gradYear = profile?.graduationYear ?? 2028;
    const monthsLeft = (gradYear - now.getFullYear()) * 12 + (3 - now.getMonth());

    const lines = [
      `[ユーザー] ${profile ? `${profile.university || ""}${profile.faculty ? " " + profile.faculty : ""} ${profile.grade || ""} ${gradYear}年卒 / 志望:${profile.targetIndustries?.join("・") || "未設定"}` : "未設定"}`,
      `[データ] 企業${companies.length}社(選考中${active.length}/内定${offered.length}/不採用${companies.filter((c: { status: string }) => c.status === "REJECTED").length}) ES${esList.length}件(提出済${esList.filter((e: { status: string }) => e.status === "SUBMITTED").length}) 面接${interviews.length}件(通過${passedInterviews}/不通過${failedInterviews}) OB訪問${obVisits.length}件 筆記${aptitudeTests.length}件`,
      pendingActions.length > 0 ? `[今週タスク] ${pendingActions.slice(0, 3).map((a: { action: string }) => a.action).join(" / ")}` : "[今週タスク] なし",
      completedActions.length > 0 ? `[完了] ${completedActions.length}件完了` : "",
      profile?.careerAxis ? `[就活の軸] ${String(profile.careerAxis).slice(0, 100)}` : "",
      profile?.strengths ? `[強み] ${String(profile.strengths).slice(0, 60)}` : "",
      `[時期] ${now.getFullYear()}年${now.getMonth() + 1}月 / 卒業まで約${monthsLeft}ヶ月`,
    ].filter(Boolean).join("\n");

    const prompt = `就活コーチAIとして以下データを分析し、JSONのみを返してください。説明文・マークダウン不要。

${lines}

{"plan":{"weeklyGoal":"今週の目標（1文）","taskCompletion":"X件中Y件完了"},"do":{"highlights":["実績1","実績2"],"totalActivity":"全体評価（1文）"},"check":{"score":50,"goodPoints":["良い点（具体的に）"],"issues":["課題（データ根拠を示して）"],"insight":"現状分析（1〜2文）"},"act":{"improvements":["アクション1（具体的に）","アクション2"],"nextWeekFocus":"最優先事項（25字以内）","encouragement":"前向きな一言"}}

scoreは整数（50=普通/75=良好/90=優秀）。`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: `JSONが見つかりません` }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(match[0]));
  } catch (err) {
    console.error("[pdca] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
