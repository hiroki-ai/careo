import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 30;

interface EsCheckResult {
  score: number;
  readyToSubmit: boolean;
  checks: { passed: boolean; label: string; detail: string }[];
  summary: string;
  suggestions: string[];
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 学生がES添削依頼を作成（AIが即時一次添削）
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { esEntryId, studentMessage } = await req.json();
  if (!esEntryId) return NextResponse.json({ error: "esEntryId が必要です" }, { status: 400 });

  const supabase = await createClient();

  // ESデータ取得
  const { data: esEntry } = await supabase
    .from("es_entries")
    .select("id, title, company_id")
    .eq("id", esEntryId)
    .eq("user_id", user.id)
    .single();

  if (!esEntry) return NextResponse.json({ error: "ESが見つかりません" }, { status: 404 });

  const { data: esQuestions } = await supabase
    .from("es_questions")
    .select("question, answer")
    .eq("es_entry_id", esEntryId)
    .order("order_index");

  // 企業名取得
  let companyName = "";
  if (esEntry.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", esEntry.company_id)
      .single();
    companyName = company?.name ?? "";
  }

  // プロフィール取得（AI添削用）
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("university, career_axis, strengths, gakuchika")
    .eq("id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });

  const esSnapshot = {
    title: esEntry.title,
    questions: (esQuestions ?? []).map((q) => ({
      question: q.question,
      answer: q.answer ?? "",
    })),
  };

  // 重複チェックなしでAI添削実行
  let aiComment: EsCheckResult | null = null;
  try {
    const systemPrompt = `あなたはCareoのES提出前チェック機能です。ESを多角的にチェックしてスコアと改善提案をJSON形式で返してください。
チェック項目: 1.自己分析との一貫性 2.具体性 3.文字数バランス 4.AI文体検出 5.志望動機の個別化
JSON: { "score":0-100, "readyToSubmit":bool, "checks":[{"passed":bool,"label":"","detail":""}], "summary":"50字以内", "suggestions":["40字以内"] }`;

    const userMessage = `企業名: ${companyName}
ES: ${esSnapshot.title}
就活の軸: ${profile.career_axis?.substring(0, 150) ?? "未入力"}
強み: ${profile.strengths?.substring(0, 100) ?? "未入力"}
${esSnapshot.questions.map((q, i) => `設問${i + 1}: ${q.question}\n回答(${q.answer.length}字): ${q.answer || "(未回答)"}`).join("\n\n")}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    aiComment = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as EsCheckResult;
  } catch {
    // AI失敗してもレコード作成は続行
  }

  const { data, error } = await supabase
    .from("es_review_requests")
    .insert({
      student_user_id: user.id,
      university: profile.university,
      es_entry_id: esEntryId,
      es_snapshot: esSnapshot,
      company_name: companyName || null,
      student_message: studentMessage ?? null,
      ai_comment: aiComment,
      ai_generated_at: aiComment ? new Date().toISOString() : null,
      status: aiComment ? "ai_done" : "pending",
    })
    .select("id, status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reviewId: data.id, status: data.status });
}

// 学生が自分の依頼一覧を取得
export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("es_review_requests")
    .select("id, company_name, status, ai_generated_at, staff_feedback, created_at, es_snapshot")
    .eq("student_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reviews: data ?? [] });
}
