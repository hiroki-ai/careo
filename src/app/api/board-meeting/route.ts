import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { EXECUTIVES, type Executive } from "@/lib/board/executives";
import { requireAdmin } from "@/lib/apiAuth";

// GET: 最新のpending会議を取得
export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return NextResponse.json(null);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("board_meetings")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

// PATCH: 承認 or 却下
export async function PATCH(request: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { id, status } = await request.json();
  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  // 承認前に会議の詳細を取得（LP更新判定のため）
  const { data: meeting } = await supabase
    .from("board_meetings")
    .select("topic_owner, topic, recommended_action, conclusion")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("board_meetings")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Goサインかつ CMO/CEO/CDO 担当の会議ならLPコピーを自動生成
  if (status === "approved" && meeting) {
    const LP_ROLES = ["takumi", "mina", "kaitoa"];
    const owner = EXECUTIVES.find(
      (e) => e.name === meeting.topic_owner && LP_ROLES.includes(e.id)
    );
    if (owner) {
      // レスポンスを待たずにバックグラウンド実行
      generateAndSaveLpCopy(meeting, owner).catch((err) =>
        console.error("[board-meeting] lp generate error:", err)
      );
    }
  }

  return NextResponse.json({ success: true });
}

async function generateAndSaveLpCopy(
  meeting: { topic: string; recommended_action: string; conclusion: string },
  owner: Executive
) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{
      role: "user",
      content: `あなたはCareo（就活生向けAI就活管理アプリ）のランディングページのコピーライターです。
${owner.name}（${owner.role}）が主導した以下の幹部会議の承認を受け、LPのコピーを更新してください。

【承認された議題】${meeting.topic}
【推奨アクション】${meeting.recommended_action}
【会議の結論】${meeting.conclusion}
【担当幹部のフォーカス】${owner.focus}

以下のJSON形式のみで返してください（マークダウン・コードブロック不要）：
{
  "hero_subtext": "ヒーロー説明文（2文・就活生に刺さる言葉・\\nで改行・100字以内）",
  "after_items": ["Careoを使った後の変化1（30字以内）", "変化2", "変化3", "変化4", "変化5"],
  "badge_text": "ヒーローのバッジテキスト（20字以内）"
}

就活生が「使ってみたい」と思う、共感・具体性・ベネフィット重視のコピーにしてください。`,
    }],
  });

  const raw = (response.content[0] as { type: string; text: string }).text
    .replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);

  const now = new Date().toISOString();
  await supabase.from("lp_settings").upsert([
    { key: "hero_subtext", value: json.hero_subtext, updated_at: now },
    { key: "after_items",  value: JSON.stringify(json.after_items), updated_at: now },
    { key: "badge_text",   value: json.badge_text, updated_at: now },
  ], { onConflict: "key" });

  console.log(`[board-meeting] LP updated by ${owner.name} (${owner.role})`);
}
