import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";
import { Company, ES, Interview, UserProfile } from "@/types";
import { getShukatsuContext } from "@/lib/shukatsuSchedule";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface InsightItem {
  type: "warning" | "tip" | "connection" | "benchmark";
  priority: "high" | "medium" | "low";
  title: string;
  body: string;
  link?: string;
  emoji?: string;
}

export async function POST(req: NextRequest) {
  const { user: _authUser, errorResponse: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "insights");
  if (!allowed) {
    return NextResponse.json({ error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` }, { status: 429 });
  }

  try {
    const {
      companies,
      esList,
      interviews,
      obVisits,
      aptitudeTests,
      profile,
      pendingActions,
    }: {
      companies: Company[];
      esList: ES[];
      interviews: Interview[];
      obVisits: { companyName: string; purpose: string }[];
      aptitudeTests: { companyName: string; testType: string; result: string }[];
      profile: UserProfile | null;
      pendingActions: string[];
    } = await req.json();

    const shukatsuCtx = getShukatsuContext(profile?.graduationYear ?? 2028);

    // Build cross-data context for Claude
    const activeCompanies = companies.filter(c =>
      !["WISHLIST", "OFFERED", "REJECTED"].includes(c.status)
    );
    const upcomingInterviews = interviews.filter(i => i.result === "PENDING");
    const draftEs = esList.filter(e => e.status === "DRAFT");
    const submittedEs = esList.filter(e => e.status === "SUBMITTED");
    const passedInterviews = interviews.filter(i => i.result === "PASS");
    const failedInterviews = interviews.filter(i => i.result === "FAIL");
    const offeredCompanies = companies.filter(c => c.status === "OFFERED");
    const visitedCompanyNames = obVisits.map(v => v.companyName);

    // Identify companies with upcoming interviews but no OB visit
    const interviewCompaniesNoOb = upcomingInterviews
      .map(i => companies.find(c => c.id === i.companyId)?.name)
      .filter(Boolean)
      .filter(name => !visitedCompanyNames.includes(name as string)) as string[];

    const systemPrompt = `あなたはCareoというAI就活コーチアプリの分析エンジン「カレオ」です。
ユーザーの就活データ全体を分析し、「点と点を繋ぐ」洞察（インサイト）を3〜5個抽出してください。

インサイトの種類:
- "warning": 今すぐ対処すべき問題・リスク（例: 面接前なのにOB訪問ゼロ）
- "connection": データ間の重要な関連性（例: ESの○○と面接での弱点が一致）
- "tip": より良くなるための具体的な提案（例: 内定率を上げるための行動）
- "benchmark": 就活の進捗ベンチマーク比較（他のCareoユーザーとの比較）

重要:
- 他のAIツールでは絶対に出せない、Careoのデータ統合だからこそ見えるインサイトだけを出す
- 具体的な企業名・設問内容・面接結果を使って個別最適化する
- 「AIっぽい当たり前のこと」は出さない
- priorityはデータから判断。内定につながる行動ほど"high"

JSON形式で返答: { "insights": [...] }
各insightは: type, priority, title(15字以内), body(60字以内), link(オプション、アプリ内パス), emoji

${shukatsuCtx.phase}フェーズ（${shukatsuCtx.currentAdvice}）`;

    const userMessage = `以下のデータを分析してインサイトを抽出してください:

現在のフェーズ: ${shukatsuCtx.phase}
卒業予定: ${profile?.graduationYear ?? 2028}年

就活状況:
- 気になる: ${companies.filter(c => c.status === "WISHLIST").length}社
- 選考中: ${activeCompanies.length}社 (${activeCompanies.map(c => c.name).join("、")})
- ES下書き: ${draftEs.length}件
- ES提出済み: ${submittedEs.length}件
- 面接予定: ${upcomingInterviews.length}件
- 面接合格: ${passedInterviews.length}件
- 面接不合格: ${failedInterviews.length}件
- OB訪問済み: ${obVisits.length}件
- 内定: ${offeredCompanies.length}社
- 筆記試験記録: ${aptitudeTests.length}件

重要な気づき:
- 面接予定があるがOB訪問未実施の企業: ${interviewCompaniesNoOb.length > 0 ? interviewCompaniesNoOb.join("、") : "なし"}
- 積み残しアクション: ${pendingActions.slice(0, 3).join("、") || "なし"}

自己分析:
- 就活の軸: ${profile?.careerAxis ? profile.careerAxis.substring(0, 100) : "未入力"}
- 強み: ${profile?.strengths ? profile.strengths.substring(0, 80) : "未入力"}
- 弱み: ${profile?.weaknesses ? profile.weaknesses.substring(0, 80) : "未入力"}

直近の面接結果:
${interviews.slice(-5).map(i => `- ${companies.find(c => c.id === i.companyId)?.name ?? "不明"} ${i.round}次: ${i.result}`).join("\n")}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as { insights: InsightItem[] };

    return NextResponse.json(json);
  } catch (e) {
    console.error("[insights]", e);
    return NextResponse.json({ insights: [] });
  }
}
