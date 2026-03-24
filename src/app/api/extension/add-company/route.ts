/**
 * Chrome拡張機能からの企業追加API
 *
 * POST /api/extension/add-company
 * Authorization: Bearer <supabase_jwt>
 * Body: { name: string, industry?: string, notes?: string, status?: string }
 *
 * requireAuth() はクッキーベースのため、拡張機能からの Bearer トークン認証には
 * createServerClient + setSession を使って手動で検証する。
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const VALID_STATUSES = [
  "WISHLIST",
  "INTERN_APPLYING",
  "INTERN_DOCUMENT",
  "INTERN_INTERVIEW_1",
  "INTERN_INTERVIEW_2",
  "INTERN_FINAL",
  "INTERN",
  "APPLIED",
  "DOCUMENT",
  "INTERVIEW_1",
  "INTERVIEW_2",
  "FINAL",
  "OFFERED",
  "REJECTED",
] as const;

type CompanyStatus = typeof VALID_STATUSES[number];

function isValidStatus(s: unknown): s is CompanyStatus {
  return typeof s === "string" && (VALID_STATUSES as readonly string[]).includes(s);
}

export async function POST(req: NextRequest) {
  // 1. Authorization ヘッダーから Bearer トークンを取得
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // 2. Supabase クライアントを生成（クッキー不使用）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 拡張機能からの呼び出しはクッキー不使用
        getAll: () => [],
        setAll: () => {},
      },
    }
  );

  // 3. JWT を使ってセッションを確立してユーザーを取得
  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: "", // リフレッシュ不要
  });

  if (sessionError || !sessionData.user) {
    return NextResponse.json({ error: "認証が無効です。再ログインしてください。" }, { status: 401 });
  }

  const userId = sessionData.user.id;

  // 4. リクエストボディを検証
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエストの形式が正しくありません" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { name, industry, notes, status } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "企業名は必須です" }, { status: 400 });
  }

  if (name.trim().length > 100) {
    return NextResponse.json({ error: "企業名は100文字以内で入力してください" }, { status: 400 });
  }

  if (notes !== undefined && typeof notes === "string" && notes.length > 500) {
    return NextResponse.json({ error: "メモは500文字以内で入力してください" }, { status: 400 });
  }

  const resolvedStatus: CompanyStatus = isValidStatus(status) ? status : "WISHLIST";

  // 5. companies テーブルに INSERT
  const { data, error } = await supabase
    .from("companies")
    .insert({
      user_id: userId,
      name: name.trim(),
      industry: (industry && typeof industry === "string") ? industry.trim() : "",
      notes: (notes && typeof notes === "string") ? notes.trim() : "",
      status: resolvedStatus,
    })
    .select("id, name, status")
    .single();

  if (error) {
    console.error("[extension/add-company] Supabase error:", error);
    return NextResponse.json({ error: "企業の追加に失敗しました。しばらく経ってから再度お試しください。" }, { status: 500 });
  }

  return NextResponse.json({ success: true, company: data }, { status: 201 });
}
