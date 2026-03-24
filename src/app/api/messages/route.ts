import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

// 学生が自分宛てのメッセージを取得
export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("career_center_messages")
    .select("*")
    .eq("student_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    messages: (data ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      isRead: m.is_read,
      createdAt: m.created_at,
    })),
  });
}

// 既読マーク
export async function PATCH(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { messageId } = await req.json();
  if (!messageId) return NextResponse.json({ error: "messageId が必要です" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("career_center_messages")
    .update({ is_read: true })
    .eq("id", messageId)
    .eq("student_user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
