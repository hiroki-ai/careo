import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");

  const supabase = await createClient();
  let query = supabase
    .from("career_center_messages")
    .select("*")
    .eq("university", staff.university)
    .order("created_at", { ascending: false });

  if (studentId) query = query.eq("student_user_id", studentId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    messages: (data ?? []).map((m) => ({
      id: m.id,
      staffId: m.staff_id,
      studentUserId: m.student_user_id,
      body: m.body,
      isRead: m.is_read,
      createdAt: m.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const { studentUserId, body } = await req.json();
  if (!studentUserId || !body?.trim()) {
    return NextResponse.json({ error: "studentUserId と body が必要です" }, { status: 400 });
  }

  const supabase = await createClient();

  // 同一大学の学生か確認
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", studentUserId)
    .eq("university", staff.university)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "学生が見つかりません" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("career_center_messages")
    .insert({
      staff_id: staff.id,
      student_user_id: studentUserId,
      university: staff.university,
      body: body.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: { id: data.id, createdAt: data.created_at } });
}
