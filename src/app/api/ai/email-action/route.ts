import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ActionResult {
  classification: "返信が必要" | "日程調整" | "ES提出" | "情報メール" | "対応不要";
  urgency: "high" | "medium" | "low";
  suggestedAction: string;
  draftReply?: string;
}

/** POST /api/ai/email-action : スレッドIDを受け取り、次アクションをAI推論 */
export async function POST(req: NextRequest) {
  const { allowed } = checkRateLimit(getClientIp(req), "email-action");
  if (!allowed) return NextResponse.json({ error: "rate_limit" }, { status: 429 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { threadIds } = await req.json() as { threadIds: string[] };
  if (!Array.isArray(threadIds) || threadIds.length === 0) {
    return NextResponse.json({ error: "no_thread_ids" }, { status: 400 });
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: threads } = await service
    .from("email_threads")
    .select("id, subject, snippet, from_domain, matched_company_name, company_id")
    .eq("user_id", user.id)
    .in("id", threadIds.slice(0, 10));
  if (!threads || threads.length === 0) {
    return NextResponse.json({ error: "no_threads" }, { status: 404 });
  }

  const results: Record<string, ActionResult> = {};

  for (const t of threads) {
    const prompt = `以下は就活生が受け取ったメールの抜粋です。次のアクションを判定してください。

件名: ${t.subject ?? ""}
送信元: ${t.from_domain ?? ""}
企業（マッチ）: ${t.matched_company_name ?? "未マッチ"}
本文プレビュー: ${t.snippet ?? ""}

JSON形式で以下を返してください：
{
  "classification": "返信が必要" | "日程調整" | "ES提出" | "情報メール" | "対応不要",
  "urgency": "high" | "medium" | "low",
  "suggestedAction": "具体的アクション（30字以内）",
  "draftReply": "（返信が必要な場合のみ）就活生らしい丁寧な返信下書き（120字以内）"
}`;

    try {
      const message = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      });
      const text = message.content[0].type === "text" ? message.content[0].text : "";
      const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
      const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as ActionResult;
      results[t.id] = json;

      // 結果をDBに保存
      await service
        .from("email_threads")
        .update({
          last_action_suggestion: json.suggestedAction,
          is_actionable: json.classification !== "対応不要" && json.classification !== "情報メール",
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);
    } catch (err) {
      console.error("[email-action]", t.id, err);
    }
  }

  return NextResponse.json({ ok: true, results });
}
