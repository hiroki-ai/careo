import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;
import { Company, ES, Interview, UserProfile } from "@/types";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";
import { getShukatsuContext } from "@/lib/shukatsuSchedule";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { user: _authUser, errorResponse: authErr } = await requireAuth();
  if (authErr) return authErr;
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "pdca");
  if (!allowed) {
    return NextResponse.json({ error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` }, { status: 429 });
  }
  try {
    const {
      companies, esList, interviews, profile,
      pendingActions, completedActions, recentChatMessages,
      obVisits, aptitudeTests,
    }: {
      companies: Company[];
      esList: ES[];
      interviews: Interview[];
      profile: UserProfile | null;
      pendingActions: { action: string; priority: string }[];
      completedActions: { action: string }[];
      recentChatMessages?: string[];
      obVisits?: { companyName: string; purpose: string; impression?: string; insights?: string }[];
      aptitudeTests?: { companyName: string; testType: string; result: string; scoreVerbal?: number; scoreNonverbal?: number }[];
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

    const offeredCompanies = companies.filter(c => c.status === "OFFERED");
    const internOffers = offeredCompanies.filter(c => (c as { is_intern_offer?: boolean | null }).is_intern_offer === true);
    const jobOffers = offeredCompanies.filter(c => (c as { is_intern_offer?: boolean | null }).is_intern_offer !== true);
    const offeredDetail = offeredCompanies.length > 0
      ? `（インターン合格: ${internOffers.length}社、内定（本選考）: ${jobOffers.length}社）`
      : "";

    const doSummary = `
【Do（今週の実績）】
- 登録企業数: ${companies.length}社（選考中: ${companies.filter(c => !["OFFERED","REJECTED","WISHLIST"].includes(c.status)).length}社、合格/内定: ${offeredCompanies.length}社${offeredDetail}、不採用: ${companies.filter(c => c.status === "REJECTED").length}社）
- ES: ${esList.length}件（提出済み: ${esList.filter(e => e.status === "SUBMITTED").length}件、下書き: ${esList.filter(e => e.status === "DRAFT").length}件）
- 面接: ${interviews.length}件（通過: ${interviews.filter(i => i.result === "PASS").length}件、不通過: ${interviews.filter(i => i.result === "FAIL").length}件、結果待ち: ${interviews.filter(i => i.result === "PENDING").length}件）
- OB/OG訪問・説明会: ${obVisits?.length ?? 0}件
- 筆記試験: ${aptitudeTests?.length ?? 0}件`;

    const obDetail = obVisits && obVisits.length > 0
      ? `\n【OB/OG訪問・説明会詳細】\n${obVisits.slice(0, 5).map(v => {
          const imp = v.impression === "positive" ? "好印象" : v.impression === "negative" ? "懸念あり" : "";
          const base = `${v.companyName}（${v.purpose}）${imp ? `[${imp}]` : ""}`;
          return v.insights ? `${base} 気づき: ${v.insights.slice(0, 80)}` : base;
        }).join("\n")}`
      : "";

    const testDetail = aptitudeTests && aptitudeTests.length > 0
      ? `\n【筆記試験詳細】\n${aptitudeTests.slice(0, 5).map(t => {
          const scores = [
            t.scoreVerbal != null ? `言語${t.scoreVerbal}` : null,
            t.scoreNonverbal != null ? `非言語${t.scoreNonverbal}` : null,
          ].filter(Boolean).join("・");
          return `${t.companyName} ${t.testType}: ${t.result}${scores ? `（${scores}）` : ""}`;
        }).join("\n")}`
      : "";

    const planSummary = pendingActions.length > 0
      ? `\n【Plan（今週のタスク）】\n${pendingActions.map(a => `- [${a.priority}] ${a.action}`).join("\n")}`
      : "\n【Plan】今週のタスクなし";

    const checkSummary = completedActions.length > 0
      ? `\n【Check用: 完了タスク】\n${completedActions.map(a => `- ${a.action}`).join("\n")}`
      : "\n【Check用: 完了タスク】なし";

    const chatSummary = recentChatMessages && recentChatMessages.length > 0
      ? `\n【ユーザーの最近の相談内容（チャット履歴）】\n${recentChatMessages.map(m => `- 「${m.slice(0, 80)}」`).join("\n")}\n→ これらの悩みや関心事をCheckとActの分析に反映すること。`
      : "";

    const ctx = getShukatsuContext(profile?.graduationYear ?? 2028);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `あなたは就活専門のパーソナルコーチAIです。ユーザーの就活データ全体を分析し、週次PDCAレポートを生成してください。

【ユーザー情報】
${profileSummary}
${selfAnalysis ? `\n【自己分析・強み・弱み】\n${selfAnalysis}` : "【自己分析】未入力"}

${doSummary}
${interviewDetail ? `\n【面接詳細】\n${interviewDetail}` : ""}
${obDetail}
${testDetail}
${planSummary}
${checkSummary}
${chatSummary}

【就活フェーズ】
現在: ${new Date().getFullYear()}年${new Date().getMonth() + 1}月 / ${ctx.nendoLabel} / フェーズ: ${ctx.phase}
${ctx.phaseDetail}
今やるべきこと: ${ctx.currentAdvice}

【分析ルール（必須）】
1. OFFERED企業は「インターン合格」か「内定（本選考）」を必ず区別して評価すること
2. 自己分析が入力されている場合は必ずCheckとActに反映する
   - 「強み○○を活かせているか」「就活の軸と志望企業のズレ」「ガクチカをどう伝えているか」
3. 面接メモがある場合は具体的な課題を指摘する
4. OB/OG訪問の有無・印象を業界研究の深さ評価に使う
5. 筆記試験のスコアがある場合は対策状況を評価する
6. Actは「具体的に何を・いつまでに」がわかるアクションにする（抽象的なアドバイスNG）
7. scoreの根拠を数字で示す（「面接通過率XX%」「応募数がフェーズ平均の何%」など）

【重要】JSONのみ出力すること。前後に説明文・マークダウン・コードブロックを一切含めないこと。各フィールドは簡潔に（配列は最大2要素、文字列は50字以内）。

{
  "plan": {
    "weeklyGoal": "今週設定されていた目標の要約（1文）",
    "taskCompletion": "X件中Y件完了"
  },
  "do": {
    "highlights": ["実績のハイライト（具体的な数字を使って）", "面接通過率・内定状況・OB訪問など"],
    "totalActivity": "全体活動量の評価（1文、フェーズとの比較を含む）"
  },
  "check": {
    "score": 75,
    "goodPoints": ["うまくいっている点（具体的に、自己分析の強みと紐づけて）"],
    "issues": ["課題・改善が必要な点（具体的に、根拠となるデータを示して）"],
    "insight": "全体の現状分析（2文以内、就活フェーズと現在地のギャップを含む）"
  },
  "act": {
    "improvements": ["次に取るべき具体的アクション（「〇〇社にOB訪問申し込む」「△△の面接対策をする」のように具体的に）"],
    "nextWeekFocus": "来週最も重要な1つのこと（25字以内）",
    "encouragement": "就活生への一言（具体的な状況に言及した前向きな一言）"
  }
}

scoreは0〜100の整数（50=フェーズ平均的進捗、75=良好、90=非常に良い）。`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No JSON", raw: text }, { status: 500 });
    try {
      return NextResponse.json(JSON.parse(jsonMatch[0]));
    } catch {
      return NextResponse.json({ error: "Parse error", raw: text }, { status: 500 });
    }
  } catch (err) {
    console.error("[pdca] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
