import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300; // Claudeが応答返すまでに時間かかる可能性
export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 日付の「5月中旬」等を数値キーに変換（ソート用）
 * 5月上旬=501 / 5月中旬=502 / 5月下旬=503 / 6月上旬=601 ...
 */
function toSortKey(display: string): number | null {
  const m = display.match(/(\d{1,2})月(上|中|下)旬/);
  if (!m) return null;
  const month = Number(m[1]);
  const part = m[2] === "上" ? 1 : m[2] === "中" ? 2 : 3;
  return month * 100 + part;
}

/**
 * 毎週月曜朝7時JSTに実行される。
 * Tavilyは使わず、Claudeに直接「毎年の傾向」を投げて現在の締切目安を更新する。
 * （Tavilyを有効化したい場合は環境変数 TAVILY_API_KEY 追加＆このルートを拡張する）
 */
export async function GET(req: NextRequest) {
  // Cron認証（Vercel Cronから呼ばれた時のみ実行）
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (process.env.CRON_SECRET && authHeader !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = service();
  const currentYear = new Date().getFullYear();
  const targetYear = currentYear + (new Date().getMonth() >= 8 ? 2 : 1); // 8月以降は2年後（翌年夏）、それ以前は1年後（今年夏）

  // 既存データを取得（企業リストが確定しているため）
  const { data: existing } = await supabase
    .from("summer_intern_deadlines")
    .select("company_name, industry, deadline_display")
    .eq("year", targetYear);

  if (!existing || existing.length === 0) {
    return NextResponse.json({ error: "no seed data for year " + targetYear }, { status: 500 });
  }

  // Claude に更新を依頼
  const companyList = existing.map((e) => `${e.company_name}（${e.industry}）: 前回=${e.deadline_display}`).join("\n");

  const system = `あなたは日本の就活市場に詳しいリサーチャーです。ユーザーから渡される企業リストについて、${targetYear}年サマーインターンの応募締切の最新情報を返してください。`;

  const userMsg = `現在: ${new Date().toISOString().slice(0, 10)}
対象年: ${targetYear}年夏インターン

以下の企業について、今年のサマーインターンの応募締切目安を「5月上旬/中旬/下旬」「6月上旬/中旬/下旬」「7月上旬/中旬/下旬」の形式で返してください。
不明な場合は「前回」の値を維持してください。大きく早まった/遅くなった情報がある場合のみ変更してください。

${companyList}

【重要】JSONのみで返答。説明文・マークダウン・コードブロックは含めないこと。

{
  "updates": [
    { "company_name": "〇〇", "deadline_display": "6月上旬", "note": "変更なし等" }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: userMsg }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("no JSON in response");

    const parsed = JSON.parse(match[0]) as { updates: { company_name: string; deadline_display: string; note?: string }[] };

    let changed = 0;
    for (const u of parsed.updates ?? []) {
      const sortKey = toSortKey(u.deadline_display);
      if (!sortKey) continue;
      const { error } = await supabase
        .from("summer_intern_deadlines")
        .update({
          deadline_display: u.deadline_display,
          deadline_sort_key: sortKey,
          note: u.note ?? null,
          confidence: "estimated",
          updated_at: new Date().toISOString(),
        })
        .eq("year", targetYear)
        .eq("company_name", u.company_name);
      if (!error) changed += 1;
    }

    return NextResponse.json({
      ok: true,
      year: targetYear,
      updated_count: changed,
      requested_count: parsed.updates?.length ?? 0,
    });
  } catch (err) {
    console.error("[summer-intern-research]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
