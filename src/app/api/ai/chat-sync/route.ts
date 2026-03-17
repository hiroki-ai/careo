import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// チャットから抽出できる自己分析フィールド
type SelfAnalysisField = "careerAxis" | "gakuchika" | "selfPr" | "strengths" | "weaknesses";

interface SyncResult {
  selfAnalysis: Partial<Record<SelfAnalysisField, string>>;
  newCompanies: string[];
  actionItems: { action: string; reason: string; priority: "high" | "medium" | "low" }[];
  shouldRefreshPdca: boolean;
}

export async function POST(req: NextRequest) {
  const { allowed } = checkRateLimit(getClientIp(req), "chat-sync");
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  try {
    const {
      recentMessages,
      existingCompanies,
      existingSelfAnalysis,
      pendingActions,
    }: {
      recentMessages: { role: "user" | "assistant"; content: string }[];
      existingCompanies: string[];
      existingSelfAnalysis: Partial<Record<SelfAnalysisField, string>>;
      pendingActions: string[];
    } = await req.json();

    if (!recentMessages || recentMessages.length === 0) {
      return NextResponse.json<SyncResult>({
        selfAnalysis: {},
        newCompanies: [],
        actionItems: [],
        shouldRefreshPdca: false,
      });
    }

    const conversationText = recentMessages
      .map(m => `[${m.role === "user" ? "ユーザー" : "カレオ"}]: ${m.content}`)
      .join("\n\n");

    const existingCompanyList = existingCompanies.join("、") || "なし";
    const pendingActionList = pendingActions.slice(0, 10).join("、") || "なし";

    const existingAnalysisText = Object.entries(existingSelfAnalysis)
      .filter(([, v]) => v)
      .map(([k, v]) => {
        const labels: Record<string, string> = {
          careerAxis: "就活の軸", gakuchika: "ガクチカ", selfPr: "自己PR",
          strengths: "強み", weaknesses: "弱み",
        };
        return `${labels[k]}: ${String(v).slice(0, 100)}`;
      })
      .join("\n") || "未入力";

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `以下のAIコーチとユーザーの会話から、就活管理アプリに保存すべき情報を抽出してください。

【会話内容】
${conversationText}

【既存データ（重複して追加しないため）】
登録済み企業: ${existingCompanyList}
未完了アクション: ${pendingActionList}
既存の自己分析:
${existingAnalysisText}

【抽出ルール】
1. selfAnalysis: 会話からユーザー自身について語った以下の情報。既存データがある場合は、より詳しい・具体的な内容のみ抽出（空文字は絶対に入れない）。
   - careerAxis: 就活の軸（なぜ働くか、どんな会社を選ぶか）
   - gakuchika: 学生時代に力を入れたこと（具体的なエピソード）
   - selfPr: 自己PR・アピールポイント
   - strengths: 強み・得意なこと
   - weaknesses: 弱み・課題・克服したいこと
2. newCompanies: 「気になる」「受けたい」「志望している」と発言した企業名のみ。登録済みは除外。
3. actionItems: 会話でカレオが具体的に「やってみて」「おすすめ」と提案したアクション。既存アクションと重複しないもの。3件以内。
4. shouldRefreshPdca: 重要な進捗（内定・落選・新企業追加・自己分析更新など）があった場合のみ true。

【重要】JSONのみ出力。説明文・コードブロック不要。

{
  "selfAnalysis": {},
  "newCompanies": [],
  "actionItems": [],
  "shouldRefreshPdca": false
}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json<SyncResult>({
        selfAnalysis: {},
        newCompanies: [],
        actionItems: [],
        shouldRefreshPdca: false,
      });
    }

    const parsed = JSON.parse(jsonMatch[0]) as SyncResult;
    // 安全にデフォルト値を保証
    return NextResponse.json<SyncResult>({
      selfAnalysis: parsed.selfAnalysis ?? {},
      newCompanies: Array.isArray(parsed.newCompanies) ? parsed.newCompanies : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
      shouldRefreshPdca: parsed.shouldRefreshPdca === true,
    });
  } catch (err) {
    console.error("[chat-sync]", err);
    return NextResponse.json<SyncResult>({
      selfAnalysis: {},
      newCompanies: [],
      actionItems: [],
      shouldRefreshPdca: false,
    });
  }
}
