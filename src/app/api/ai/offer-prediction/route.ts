import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";

export const maxDuration = 60;
import { Company, ES, Interview, UserProfile } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { user: _authUser, errorResponse: authErr } = await requireAuth();
  if (authErr) return authErr;
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "offer-prediction");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }

  try {
    const {
      companies,
      esList,
      interviews,
      profile,
    }: {
      companies: Company[];
      esList: ES[];
      interviews: Interview[];
      profile: UserProfile | null;
    } = await req.json();

    const profileSummary = profile
      ? `ユーザー: ${profile.university || ""}${profile.faculty ? " " + profile.faculty : ""} ${profile.grade} ${profile.graduationYear}年卒 / 志望: ${(profile.targetIndustries ?? []).join("・") || "未設定"} / 就活軸: ${profile.careerAxis || "未設定"}`
      : "プロフィール未設定";

    const selfAnalysis = profile ? [
      profile.careerAxis ? `就活の軸: ${profile.careerAxis}` : "",
      profile.gakuchika ? `ガクチカ: ${profile.gakuchika}` : "",
      profile.selfPr ? `自己PR: ${profile.selfPr}` : "",
      profile.strengths ? `強み: ${profile.strengths}` : "",
      profile.weaknesses ? `弱み: ${profile.weaknesses}` : "",
    ].filter(Boolean).join("\n") : "";

    const activeCompanies = companies.filter(
      (c) => !["WISHLIST", "REJECTED"].includes(c.status)
    );
    const offeredCount = companies.filter((c) => c.status === "OFFERED").length;
    const interviewPassCount = interviews.filter((i) => i.result === "PASS").length;
    const interviewTotalCount = interviews.filter((i) => i.result !== "PENDING").length;
    const esSubmittedCount = esList.filter((e) => e.status === "SUBMITTED").length;

    const dataSummary = `
【選考状況】
- 選考中企業数: ${activeCompanies.length}社
- 内定数: ${offeredCount}社
- ES提出数: ${esSubmittedCount}件
- 面接: 計${interviews.length}回（通過: ${interviewPassCount}回、不通過: ${interviewTotalCount - interviewPassCount}回、結果待ち: ${interviews.filter((i) => i.result === "PENDING").length}回）
- 面接通過率: ${interviewTotalCount > 0 ? Math.round((interviewPassCount / interviewTotalCount) * 100) : 0}%
- 最終面接到達企業: ${companies.filter((c) => ["FINAL", "OFFERED"].includes(c.status)).length}社`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `あなたは就活AIコーチです。以下の就活データをもとに内定獲得予測スコアを算出してください。

${profileSummary}
${selfAnalysis ? `\n【自己分析（ユーザーが入力した情報）】\n${selfAnalysis}\n→ ガクチカ・自己PRの質と具体性、強み・弱みの自己認識度もスコアに反映すること。` : ""}
${dataSummary}

以下のJSON形式のみで返してください。他のテキストは一切含めないでください。マークダウン記法も使わないでください。

{
  "score": 72,
  "grade": "B",
  "summary": "現状の総評（2文以内）",
  "strengths": ["強み・うまくいっている点1", "強み2"],
  "improvements": ["改善点1", "改善点2"]
}

gradeはS(90〜100)/A(75〜89)/B(55〜74)/C(0〜54)。
scoreは選考中企業数・面接通過率・ES数・最終面接数に加え、自己分析の質（ガクチカ・自己PR・強み弱みの充実度）も加味した0〜100の整数。
improvementsでは自己分析情報を踏まえた具体的な改善点を指摘すること（例: 「弱みの○○を克服するため〜」「ガクチカをもっと数値で表現すると〜」）。`,
        },
      ],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";
    // Strip markdown code fences if present
    const stripped = rawText.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No JSON", raw: rawText }, { status: 500 });
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("[offer-prediction] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
