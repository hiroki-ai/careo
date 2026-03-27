import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tavily } from "@tavily/core";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;
  void user;

  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "selection-schedule");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }

  const { companyName, industry, graduationYear } = await req.json() as {
    companyName: string;
    industry?: string;
    graduationYear?: number;
  };

  if (!companyName) {
    return NextResponse.json({ error: "企業名は必須です" }, { status: 400 });
  }

  const targetYear = graduationYear ?? 2028;
  const isInternPhase = (targetYear - new Date().getFullYear()) >= 1;
  const phaseNote = isInternPhase
    ? "インターン選考・本選考両方の日程を含めてください。"
    : "本選考の日程を中心にまとめてください。";

  // Tavilyで採用情報を検索（APIキーがない場合はスキップ）
  let searchContext = "";
  if (process.env.TAVILY_API_KEY) {
    try {
      const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
      const searchYear = targetYear - 1; // 例: 28卒 → 2027年の情報を検索
      const result = await client.search(
        `${companyName} 採用 選考フロー ${searchYear}卒 日程`,
        { maxResults: 3, searchDepth: "basic" }
      );
      if (result.results.length > 0) {
        searchContext = result.results
          .map((r) => `【${r.title}】\n${r.content}`)
          .join("\n\n");
      }
    } catch {
      // 検索失敗はClaudeの知識ベースで補完するため無視
    }
  }

  const prompt = `就活生向けに「${companyName}」${industry ? `（${industry}）` : ""}の選考スケジュールをまとめてください。${phaseNote}

${searchContext ? `【最新の採用情報（Web検索結果）】\n${searchContext}\n\n上記の情報を優先して使用し、不明な部分は一般的な就活スケジュールで補完してください。` : "一般的な就活スケジュールと業界特性に基づいて推定してください。"}

以下の構成でJSONのみ返してください（説明文・マークダウン不要）：

{
  "stages": [
    { "name": "ステージ名", "timing": "時期（例: 6月上旬）", "notes": "補足（任意）" }
  ],
  "overallTimeline": "全体の流れを1文で（例: 6月エントリー〜10月内定）",
  "tips": "この企業の選考で特に注意すべき点（1〜2文、任意）",
  "disclaimer": "${searchContext ? "Web検索情報をもとにAIが整理しました。" : "AIによる推定です。"}必ず公式採用ページで最新情報をご確認ください。"
}

- 企業が実在しない・情報が不明な場合はstagesを空配列、overallTimelineに「公式採用サイトをご確認ください」と記載
- 業界・企業規模・選考形態（総合職/技術職/コース別など）を考慮してください`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text ?? "";
  const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "スケジュール取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(JSON.parse(match[0]));
}
