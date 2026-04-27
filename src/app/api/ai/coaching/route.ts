import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getShukatsuContext } from "@/lib/shukatsuSchedule";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface CoachingRequest {
  profile: {
    graduationYear?: number;
    jobSearchStage?: "not_started" | "just_started" | "in_progress";
    careerAxis?: string;
    targetIndustries?: string[];
    targetJobs?: string[];
  } | null;
  companies: { id: string; status: string; name: string }[];
  interviews: { result: string; round: number }[];
  esCount: number;
  obVisitCount: number;
  /**
   * "starter" = 就活開始時のキックオフコーチング
   * "checkpoint" = 直前確認（面接前・選考佳境など）
   * "reflection" = 進行中の振り返り
   */
  mode: "starter" | "checkpoint" | "reflection";
}

interface CoachingResponse {
  level: "beginner" | "intermediate" | "advanced";
  headline: string;
  summary: string;
  actions: { title: string; reason: string; deadline?: string }[];
  watchOuts: string[];
  encouragement: string;
}

function detectLevel(req: CoachingRequest): "beginner" | "intermediate" | "advanced" {
  const stage = req.profile?.jobSearchStage ?? "not_started";
  const dataPoints = req.companies.length + req.interviews.length + req.esCount + req.obVisitCount;
  if (stage === "not_started" || dataPoints <= 2) return "beginner";
  if (stage === "in_progress" && dataPoints >= 15) return "advanced";
  return "intermediate";
}

export async function POST(req: NextRequest) {
  const { allowed } = checkRateLimit(getClientIp(req), "coaching");
  if (!allowed) return NextResponse.json({ error: "rate_limit" }, { status: 429 });

  try {
    const body = (await req.json()) as CoachingRequest;
    const level = detectLevel(body);
    const ctx = getShukatsuContext(body.profile?.graduationYear ?? 2028);

    const offered = body.companies.filter(c => c.status === "OFFERED").length;
    const active = body.companies.filter(c => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status)).length;
    const upcoming = body.interviews.filter(i => i.result === "PENDING").length;

    const levelGuidance = {
      beginner: `【対象: やり始めの就活生】
- 専門用語をかみ砕き、抽象的アドバイスは避け「今日やること1つ」を最優先で提示
- 「自己分析」より「実際に1社調べる」「説明会1つ予約する」など具体的アクション
- 完璧を求めず、最初の一歩を踏み出すことを称賛するトーン
- 締切は「今日中」「明日中」など極めて短く設定`,
      intermediate: `【対象: 数社進めている就活生】
- 抜け漏れている準備（OB訪問・SPI対策・志望動機の磨き込み等）を指摘
- 横展開（業界の追加調査・複数企業比較）を促す
- 進行中選考の優先順位付けを提示
- 「今週中」など中期的なタイムライン`,
      advanced: `【対象: 多数の選考を並行している先行者】
- 蓄積データ（${body.companies.length}社・面接${body.interviews.length}件・ES${body.esCount}件）を踏まえた戦略的助言
- 内定後の比較軸、最終面接の差別化、長期キャリア軸の確立
- 凡庸な精神論は避け、データドリブン・差別化視点・意思決定支援を重視
- 必要に応じて「諦めるべき選考」も明示する判断支援`,
    }[level];

    const modeFocus = {
      starter: "今からスタートを切るためのキックオフ。最初に踏み出すべき具体的アクションを最優先。",
      checkpoint: "直近の重要イベント（面接・締切）の直前確認。心構えと最終チェックリスト。",
      reflection: "ここまでの進捗を踏まえた次の打ち手。停滞・抜け漏れがないかの確認。",
    }[body.mode];

    const prompt = `あなたは就活コーチです。以下の就活生に対し、レベル別に適切な深度・トーンでコーチングしてください。

【就活生の状況】
- ${ctx.nendoLabel}・卒業まで${ctx.monthsUntil}ヶ月（${ctx.phase}）
- ジョブステージ: ${body.profile?.jobSearchStage ?? "未設定"}
- 選考中 ${active}社 / 内定 ${offered}社 / 結果待ち面接 ${upcoming}件
- ES作成 ${body.esCount}件 / OB訪問 ${body.obVisitCount}件
- 軸: ${body.profile?.careerAxis ?? "未設定"}
- 志望業界: ${body.profile?.targetIndustries?.join("、") ?? "未設定"}

【今期にやるべきこと（汎用）】
${ctx.currentAdvice}

【コーチングモード】
${modeFocus}

【レベル分岐ガイド】
${levelGuidance}

【出力形式】
以下のJSON形式で返してください：
{
  "headline": "20字以内の今日のキャッチコピー",
  "summary": "100字以内のいまの状況サマリ",
  "actions": [
    { "title": "具体的アクション", "reason": "なぜそれが必要か（30字以内）", "deadline": "いつまでに（例: 今日中／今週中）" }
  ],
  "watchOuts": ["注意点1", "注意点2"],
  "encouragement": "60字以内の前向きな一言"
}
- actions は2〜4件
- watchOuts は1〜3件
- レベル ${level} のトーンを守ること`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);

    const result: CoachingResponse = {
      level,
      headline: String(json.headline ?? ""),
      summary: String(json.summary ?? ""),
      actions: Array.isArray(json.actions) ? json.actions.slice(0, 4) : [],
      watchOuts: Array.isArray(json.watchOuts) ? json.watchOuts.slice(0, 3) : [],
      encouragement: String(json.encouragement ?? ""),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[coaching]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
