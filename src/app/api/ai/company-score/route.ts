import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";
import { checkAndConsumeAiUsage } from "@/lib/aiUsageLimit";
import { selectAiModel } from "@/lib/aiModel";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type Profile = {
  university?: string;
  faculty?: string;
  graduationYear?: number;
  targetIndustries?: string[];
  targetJobs?: string[];
  careerAxis?: string;
  gakuchika?: string;
  selfPr?: string;
  strengths?: string;
  weaknesses?: string;
};

type CompanyInput = {
  name: string;
  industry?: string;
  status?: string;
  notes?: string;
  deadline?: string;
  /** 既に手動入力済みの自分視点メモがあれば加点材料にする */
  whyForMe?: string[];
  concerns?: string[];
};

export async function POST(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "company-score");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }
  const usage = await checkAndConsumeAiUsage(user.id, "company-score");
  if (!usage.allowed) {
    return NextResponse.json({
      error: "合格可能性スコア機能は今月の無料枠を使い切りました。",
      limitExceeded: true, feature: "company-score", limit: usage.limit,
    }, { status: 402 });
  }

  const { profile, company } = await req.json() as {
    profile?: Profile;
    company?: CompanyInput;
  };

  if (!company?.name) {
    return NextResponse.json({ error: "企業名が必要です" }, { status: 400 });
  }

  const profileLines = [
    profile?.university && profile?.faculty
      ? `大学・学部: ${profile.university} ${profile.faculty}`
      : "",
    profile?.graduationYear ? `卒業年: ${profile.graduationYear}卒` : "",
    profile?.careerAxis ? `就活の軸: ${profile.careerAxis.slice(0, 400)}` : "",
    profile?.gakuchika ? `ガクチカ: ${profile.gakuchika.slice(0, 400)}` : "",
    profile?.strengths ? `強み: ${profile.strengths.slice(0, 300)}` : "",
    profile?.selfPr ? `自己PR(抜粋): ${profile.selfPr.slice(0, 200)}` : "",
    profile?.weaknesses ? `弱み: ${profile.weaknesses.slice(0, 200)}` : "",
    profile?.targetIndustries?.length ? `志望業界: ${profile.targetIndustries.join("・")}` : "",
    profile?.targetJobs?.length ? `志望職種: ${profile.targetJobs.join("・")}` : "",
  ].filter(Boolean).join("\n");

  const companyLines = [
    `企業名: ${company.name}`,
    company.industry ? `業界: ${company.industry}` : "",
    company.status ? `現在の選考ステータス: ${company.status}` : "",
    company.deadline ? `締切: ${company.deadline}` : "",
    company.notes ? `メモ: ${company.notes.slice(0, 300)}` : "",
    company.whyForMe?.length ? `本人が考える「合う理由」:\n  - ${company.whyForMe.join("\n  - ")}` : "",
    company.concerns?.length ? `本人が感じる懸念点:\n  - ${company.concerns.join("\n  - ")}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `あなたは新卒採用の構造に精通したキャリアアドバイザーです。学生本人のプロフィールと志望企業の情報から、「合格可能性スコア（0-100）」と「自分視点での合致度」を機械的に算出します。

【採点ルーブリック・100点満点】
① 学歴フィット (max 20)
   - その大学・学部が標準的に通る企業層なら 18-20
   - ボーダーラインなら 10-14
   - ほぼ通らない（外資戦コン本気・外資銀MD等）なら 3-8

② ガクチカ・実績適合度 (max 25)
   - 業務に直接活きるなら 22-25
   - 一部活きるなら 15-20
   - 周辺領域なら 8-12
   - ほぼ活きないなら 0-5

③ 軸の一貫性 (max 20)
   - 本人の軸と企業が一発で繋がるなら 18-20
   - 説明すれば繋がるなら 13-17
   - 無理筋なら 8-12
   - 真逆の軸なら 2-6

④ 競争激しさ (max 15) ※倍率が低いほど高得点
   - 中堅・ニッチ・タイミング良し: 13-15
   - 大手・標準的難易度: 10-12
   - 超激戦（人気メガベン・大手商社・一流コンサル）: 5-8
   - 超超激戦（MBB・三菱商事・キー局）: 2-4

⑤ 英語必要度 (max 10) ※本人の英語力で問題なくこなせるなら高得点
   - 不要・国内日系: 9-10
   - 読み書きできれば良い: 6-8
   - 社内英語あり: 3-5
   - 必須（外資・海外駐在前提）: 1-2

⑥ 特殊要因 (max 10)
   - OB訪問しやすい/ゼミ接点/締切タイミング合う等: +2〜+8
   - 該当なし: 5（中立）
   - 既受験不合格・選考難易度悪化: -3〜-5（5から減算、最低0）
   - 【働く環境の質】も加算/減算で反映：
     * 若手裁量あり（1〜3年目で動ける）= +1
     * 影響力が外（クライアント・社会・SNS）に見える = +1
     * 同世代の存在感（おじさんばかりじゃない・新卒比率高い）= +1
     * 社風の活気あり（楽しい・明るい職場）= +1
     * 規模感バランス良い（1,000〜10,000名・成長フェーズ）= +1
     * 大企業（10,000名以上）で歯車化リスクあり = -2
     * 数十人スタートアップで基盤不安定 = -2

合計 = ① + ② + ③ + ④ + ⑤ + ⑥（0-100にクランプ）

【志望度・軸合致度の判定】
- axis_match: perfect=本人の軸と一直線 / strong=強く合う / neutral=要確認 / mismatch=合わない
- tier: safe=合格可能性80以上の安全圏 / effort=65-79の努力圏 / challenge=64以下の挑戦圏
- vision_fit_5y: 5年後にその企業で「成長実感」「責任ある立場」が得られるか（excellent/good/conditional/difficult）
- vision_fit_10y: 10年後にその経験が転職市場で価値になるか（excellent/good/conditional/difficult）

【本人プロフィール】
${profileLines || "（情報なし。一般的な28卒新卒として扱う）"}

【企業情報】
${companyLines}

以下のJSONのみ返してください（説明文・マークダウン・コードブロック不要）：

{
  "passScore": 0-100の整数,
  "passScoreBreakdown": {
    "gakureki": 0-20の整数,
    "gakuchika": 0-25の整数,
    "axis": 0-20の整数,
    "competition": 0-15の整数,
    "english": 0-10の整数,
    "special": 0-10の整数
  },
  "passScoreNote": "スコアの根拠を1-2文で（例: 上智経済が射程・ガクチカ直撃・軸も合う）",
  "tier": "safe" | "effort" | "challenge",
  "axisMatch": "perfect" | "strong" | "neutral" | "mismatch",
  "visionFit5y": "excellent" | "good" | "conditional" | "difficult",
  "visionFit5yNote": "5年後の理由を1文",
  "visionFit10y": "excellent" | "good" | "conditional" | "difficult",
  "visionFit10yNote": "10年後の理由を1文",
  "tagline": "企業を一行で表す説明（30字以内）",
  "positioning": "業界内での立ち位置（50字以内）",
  "strengths": ["企業の強み1", "企業の強み2", "企業の強み3"],
  "whyForMe": ["なぜこの人に合うか1", "なぜこの人に合うか2", "なぜこの人に合うか3"],
  "concerns": ["懸念点1", "懸念点2"],
  "recommendedRoles": ["おすすめ職種1", "おすすめ職種2"]
}`;

  const { model } = await selectAiModel(user.id);
  const message = await anthropic.messages.create({
    model,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text ?? "";
  const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "採点結果の取得に失敗しました" }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(match[0]);
    // breakdown の合計と passScore のズレを補正
    const b = parsed.passScoreBreakdown;
    if (b && typeof b === "object") {
      const sum = (b.gakureki ?? 0) + (b.gakuchika ?? 0) + (b.axis ?? 0) + (b.competition ?? 0) + (b.english ?? 0) + (b.special ?? 0);
      const clamped = Math.max(0, Math.min(100, sum));
      // breakdown の合計と乖離が大きい場合は breakdown 合計を採用
      if (Math.abs(clamped - (parsed.passScore ?? 0)) > 3) {
        parsed.passScore = clamped;
      }
      parsed.passScore = Math.max(0, Math.min(100, parsed.passScore ?? clamped));
    }
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "JSON解析に失敗しました" }, { status: 500 });
  }
}
