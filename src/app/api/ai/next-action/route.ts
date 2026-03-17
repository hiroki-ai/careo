import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { Company, ES, Interview, UserProfile } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 28卒就活スケジュール（TikTok就活インフルエンサー発・実体験ベース）
const SHUKATSU_SCHEDULE_28 = `【28卒就活スケジュール 標準ロードマップ】
3月（大学3年開始）: 就活メール作成・証明写真・就活会議/ワンキャリ/マイナビキャンパス登録・説明会参加・サマーインターン応募開始・Webテスト練習必須
4〜5月: ES作成（ガクチカ・自己PR）・業界説明会・SPI勉強・面接練習開始・夏インターン参加・ベンチャー選考で面接経験を積む
6〜8月: 夏インターンエントリー（目安60〜100社/1業界12〜20社×5業界）・SPI/Webテスト対策・OB/OG訪問・逆質問・難質問のストックを貯める
9〜12月: 夏インターン振り返り・早期選考ルート（ここで内定も）・冬インターンエントリー（本選考直結が多い）・業界絞り込み・OB/OG訪問継続
1〜3月: 本選考企業決定・本選考エントリー・企業分析・キャリアプラン・SPI/Webテスト（ラストチャンス）
4月: 内定獲得・就活終了（就活生の6割以上がこの時期に終了）

【重要ポイント】
- 早期選考ルートに乗れれば年内内定も可能
- 就活の軸を一貫させることが志望動機の説得力につながる
- 面接は場数が全て。ベンチャー・インターンで早めに経験を積む
- OB/OG訪問は業界理解と面接練習を兼ねられる最強手段`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "next-action");
  if (!allowed) {
    return NextResponse.json({ error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` }, { status: 429 });
  }
  try {
  const { companies, esList, interviews, profile, completedActions, recentChatMessages }: {
    companies: Company[];
    esList: ES[];
    interviews: Interview[];
    profile: UserProfile | null;
    completedActions: string[];
    recentChatMessages?: string[];
  } = await req.json();

  // 集合知を取得
  let aggregateSummary = "";
  try {
    const { data } = await supabase.rpc("get_careo_aggregate_insights");
    if (data) {
      const d = data as {
        total_users?: number;
        avg_companies_per_user?: number;
        top_industries?: string[];
        offer_rate?: number;
        avg_interviews_before_offer?: number;
      };
      const parts: string[] = [];
      if (d.total_users) parts.push(`Careo利用者数: ${d.total_users}人`);
      if (d.avg_companies_per_user) parts.push(`ユーザー平均応募数: ${d.avg_companies_per_user}社`);
      if (d.top_industries?.length) parts.push(`人気業界Top5: ${d.top_industries.join("・")}`);
      if (d.offer_rate != null) parts.push(`Careoユーザーの内定率: ${d.offer_rate}%`);
      if (d.avg_interviews_before_offer) parts.push(`内定までの平均面接数: ${d.avg_interviews_before_offer}回`);
      if (parts.length > 0) aggregateSummary = `\nCareo集合知（全ユーザーの匿名統計）:\n${parts.map(p => `- ${p}`).join("\n")}`;
    }
  } catch { /* 集合知取得失敗時はスキップ */ }

  const profileSummary = profile
    ? `ユーザープロフィール:
- 大学: ${profile.university || "未設定"}
- 学部・研究科: ${profile.faculty || "未設定"}
- 学年: ${profile.grade}
- 卒業予定: ${profile.graduationYear}年
- 就活の進み具合: ${profile.jobSearchStage === "not_started" ? "まだ始めていない" : profile.jobSearchStage === "just_started" ? "始めたばかり" : "本格的に進めている"}
- 志望業界: ${profile.targetIndustries.length > 0 ? profile.targetIndustries.join("、") : "未設定"}
- 志望職種: ${profile.targetJobs.length > 0 ? profile.targetJobs.join("、") : "未設定"}`
    : "プロフィール: 未設定";

  const selfAnalysis = profile ? [
    profile.careerAxis ? `就活の軸: ${profile.careerAxis}` : "",
    profile.gakuchika ? `ガクチカ: ${profile.gakuchika}` : "",
    profile.selfPr ? `自己PR: ${profile.selfPr}` : "",
    profile.strengths ? `強み: ${profile.strengths}` : "",
    profile.weaknesses ? `弱み（克服すべき課題）: ${profile.weaknesses}` : "",
  ].filter(Boolean).join("\n") : "";

  const completedSummary = completedActions.length > 0
    ? `\n完了済みタスク（これらはすでに達成済みなので提案しないこと）:\n${completedActions.map(a => `- ${a}`).join("\n")}`
    : "";

  const chatSummary = recentChatMessages && recentChatMessages.length > 0
    ? `\nユーザーの最近の相談・悩み（チャット履歴より）:\n${recentChatMessages.map(m => `- 「${m.slice(0, 80)}」`).join("\n")}\n→ これらの悩みや関心事を踏まえてアドバイスすること。`
    : "";

  const activitySummary = `就活実績:
- 企業数: ${companies.length}社（内定: ${companies.filter(c => c.status === "OFFERED").length}社、選考中: ${companies.filter(c => !["OFFERED","REJECTED","WISHLIST"].includes(c.status)).length}社）
- ES: ${esList.length}件（下書き: ${esList.filter(e => e.status === "DRAFT").length}件）
- 面接: ${interviews.length}件
- 直近締切: ${esList.filter(e => e.deadline && e.status === "DRAFT").map(e => e.title).slice(0, 3).join("、") || "なし"}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `あなたは就活のパーソナルAIアドバイザーです。以下の情報をもとに今週やるべきことを具体的に提案してください。

現在: ${new Date().getFullYear()}年${new Date().getMonth() + 1}月

${SHUKATSU_SCHEDULE_28}
→ 上記スケジュールと現在の月を照らし合わせ、「今の時期に本来やるべきこと」と「ユーザーの実際の進捗」のギャップを分析してアドバイスすること。

${profileSummary}
${selfAnalysis ? `\n【自己分析（ユーザーが入力した情報）】\n${selfAnalysis}` : ""}

${activitySummary}
${completedSummary}
${chatSummary}
${aggregateSummary}

以下のJSON形式のみで返してください。他のテキストは一切含めないでください。

{
  "summary": "現状の一言評価（1文、具体的に）",
  "weeklyActions": [
    {
      "priority": "high",
      "action": "具体的なアクション（25字以内）",
      "reason": "理由（1文、集合知があれば活用）"
    }
  ]
}

weeklyActionsは3〜5個。priority は "high" / "medium" / "low"。
就活未開始の場合は「就活用Gmailの作成」「自己分析ノートを作る」「マイナビ・リクナビに登録する」「SPIの参考書を購入する」などの初歩的なアドバイスを含めること。
学部・研究科の情報がある場合は、その専攻を活かせる企業・職種・アピールポイントを具体的にアドバイスすること（例: 情報工学→エンジニア職でのOB訪問推奨、経済学部→金融・コンサルのSPI数学対策など）。
自己分析情報がある場合は必ずそれを活用すること。例: 弱みがある場合はその克服アクションを提案、ガクチカがある場合はそれをどのES・面接で活かすか提案、就活の軸と志望企業のズレがあれば指摘すること。
集合知がある場合は「Careoユーザーの平均では〜」という形で根拠を示すこと。`,
    }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: "No JSON in response", raw: text }, { status: 500 });
  try {
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch {
    return NextResponse.json({ error: "Parse error", raw: text }, { status: 500 });
  }
  } catch (err) {
    console.error("[next-action] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
