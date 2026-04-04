import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// GET: 承認済みレビューをLP用に返す（認証不要）
export async function GET() {
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("user_reviews")
    .select("id, quote, display_name, university, rating")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(9);
  return NextResponse.json({ reviews: data ?? [] });
}

// POST: ログインユーザーがレビューを投稿
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { rating, quote, display_name, university } = body;

  if (!rating || !quote || !display_name) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }
  if (quote.length < 10 || quote.length > 300) {
    return NextResponse.json({ error: "コメントは10〜300文字で入力してください" }, { status: 400 });
  }

  // 既に投稿済みかチェック
  const { data: existing } = await supabase
    .from("user_reviews")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (existing) {
    return NextResponse.json({ error: "すでにレビューを投稿済みです" }, { status: 409 });
  }

  const { error } = await supabase.from("user_reviews").insert({
    user_id: user.id,
    rating,
    quote: quote.trim(),
    display_name: display_name.trim(),
    university: university?.trim() || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
