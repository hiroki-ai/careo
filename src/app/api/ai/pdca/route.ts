import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { Company, ES, Interview, UserProfile } from "@/types";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getShukatsuContext } from "@/lib/shukatsuSchedule";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "pdca");
  if (!allowed) {
    return NextResponse.json({ error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` }, { status: 429 });
  }
  try {
    const { companies, esList, interviews, profile, pendingActions, completedActions, recentChatMessages }: {
      companies: Company[];
      esList: ES[];
      interviews: Interview[];
      profile: UserProfile | null;
      pendingActions: { action: string; priority: string }[];
      completedActions: { action: string }[];
      recentChatMessages?: string[];
    } = await req.json();

    const profileSummary = profile
      ? `ユーザー: ${profile.university || ""}${profile.faculty ? " " + profile.faculty : ""} ${profile.grade} ${profile.graduationYear}年卒 / 志望: ${profile.targetIndustries.join("・") || "未設定"} ${profile.targetJobs.join("・") || ""}`
      : "プロフィール未設定";

    const selfAnalysis = profile ? [
      profile.careerAxis ? `就活の軸: ${profile.careerAxis}` : "",
      profile.gakuchika ? `ガクチカ: ${profile.gakuchika}` : "",
      profile.selfPr ? `自己PR: ${profile.selfPr}` : "",
      profile.strengths ? `強み: ${profile.strengths}` : "",
      profile.weaknesses ? `弱み: ${profile.weaknesses}` : "",
    ].filter(Boolean).join("\n") : "";

    const interviewDetail = interviews.length > 0
      ? interviews.slice(0, 10).map(i => {
          const base = `${(i as { companyName?: string }).companyName ?? "企業"} ${i.round}次: ${i.result}`;
          return (i as { notes?: string }).notes ? `${base}（メモ: ${(i as { notes?: string }).notes!.slice(0, 100)}）` : base;
        }).join("\n")
      : "";

    const doSummary = `
【Do（実績）】
- 登録企業数: ${companies.length}社（WISHLIST除く選考中: ${companies.filter(c => !["OFFERED","REJECTED","WISHLIST"].includes(c.status)).length}社、内定: ${companies.filter(c => c.status === "OFFERED").length}社、不採用: ${companies.filter(c => c.status === "REJECTED").length}社）
- ES: ${esList.length}件（提出済み: ${esList.filter(e => e.status === "SUBMITTED").length}件、下書き: ${esList.filter(e => e.status === "DRAFT").length}件）
- 面接: ${interviews.length}件（通過: ${interviews.filter(i => i.result === "PASS").length}件、不通過: ${interviews.filter(i => i.result === "FAIL").length}件、結果待ち: ${interviews.filter(i => i.result === "PENDING").length}件）`;

    const planSummary = pendingActions.length > 0
      ? `\n【Plan（今週のタスク）】\n${pendingActions.map(a => `- [${a.priority}] ${a.action}`).join("\n")}`
      : "\n【Plan】今週のタスクなし";

    const checkSummary = completedActions.length > 0
      ? `\n【Check用: 完了タスク】\n${completedActions.map(a => `- ${a.action}`).join("\n")}`
      : "\n【Check用: 完了タスク】なし";

    const chatSummary = recentChatMessages && recentChatMessages.length > 0
      ? `\n【ユーザーの最近の相談内容（チャット履歴）】\n${recentChatMessages.map(m => `- 「${m.slice(0, 80)}」`).join("\n")}\n→ これらの悩みや関心事をCheckとActの分析に反映すること。`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `あなたは就活コーチAIです。以下の就活データをもとにPDCAサイクルを分析してください。

${profileSummary}
${selfAnalysis ? `\n【自己分析・強み・弱み】\n${selfAnalysis}` : ""}
${doSummary}
${interviewDetail ? `\n【面接詳細】\n${interviewDetail}` : ""}
${planSummary}
${checkSummary}
${chatSummary}

現在: ${new Date().getFullYear()}年${new Date().getMonth() + 1}月
${(() => { const ctx = getShukatsuContext(profile?.graduationYear ?? 2028); return `対象: ${ctx.nendoLabel} / 現在フェーズ: ${ctx.phase}\n${ctx.phaseDetail}\n${ctx.schedule}\n\n今やるべきこと: ${ctx.currentAdvice}`; })()}

【分析の重要ルール】
- 自己分析（就活の軸・ガクチカ・自己PR・強み・弱み）が入力されている場合、それをCheckとActの評価に必ず反映すること
- 例: 「強みの○○を活かせているか」「就活の軸と志望企業が一致しているか」「ガクチカをESや面接でどう伝えているか」
- 面接のメモがある場合は具体的な課題を指摘すること

以下のJSON形式のみで返してください。他のテキストは一切含めないでください。

{
  "plan": {
    "weeklyGoal": "今週設定されていた目標の要約（1文）",
    "taskCompletion": "X件中Y件完了"
  },
  "do": {
    "highlights": ["実績のハイライト（具体的に）", "面接通過率や内定状況など"],
    "totalActivity": "全体活動量の評価（1文）"
  },
  "check": {
    "score": 75,
    "goodPoints": ["うまくいっている点（具体的に）"],
    "issues": ["課題・改善が必要な点（具体的に）"],
    "insight": "全体の現状分析（2文以内）"
  },
  "act": {
    "improvements": ["次に取るべき改善アクション（具体的に）"],
    "nextWeekFocus": "来週最も重要な1つのこと（25字以内）",
    "encouragement": "就活生への一言（前向きに、1文）"
  }
}

scoreは0〜100の整数（50=平均的進捗、75=良好、90=非常に良い）。
具体的な数字を使い、「応募数が平均より少ない」「面接通過率が高い」など根拠ある評価をすること。`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No JSON", raw: text }, { status: 500 });
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("[pdca] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
