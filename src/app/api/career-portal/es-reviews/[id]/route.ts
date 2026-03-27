import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("es_review_requests")
    .select("*")
    .eq("id", id)
    .eq("university", staff.university)
    .single();

  if (error || !data) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

  // アクセスログ記録（非同期・失敗しても無視）
  void supabase.from("career_center_access_logs").insert({
    staff_id: staff.id,
    student_user_id: data.student_user_id,
    university: staff.university,
  });

  return NextResponse.json({ review: data });
}

// 職員がフィードバックを保存
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const { staffFeedback, status } = await req.json();

  const supabase = await createClient();
  const { error } = await supabase
    .from("es_review_requests")
    .update({
      staff_feedback: staffFeedback,
      staff_id: staff.id,
      status: status ?? "staff_done",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("university", staff.university);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
