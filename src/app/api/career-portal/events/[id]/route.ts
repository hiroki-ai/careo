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

  const [eventRes, attendancesRes] = await Promise.all([
    supabase
      .from("career_center_events")
      .select("*")
      .eq("id", id)
      .eq("university", staff.university)
      .single(),
    supabase
      .from("career_center_event_attendances")
      .select("id, student_user_id, attended_at")
      .eq("event_id", id),
  ]);

  if (!eventRes.data) return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });

  const attendees = attendancesRes.data ?? [];
  const studentIds = attendees.map((a) => a.student_user_id);

  // 参加学生の基本情報取得
  let studentInfoMap: Record<string, { faculty: string; grade: string; graduationYear: number }> = {};
  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, faculty, grade, graduation_year")
      .in("id", studentIds);

    for (const p of profiles ?? []) {
      studentInfoMap[p.id] = {
        faculty: p.faculty,
        grade: p.grade,
        graduationYear: p.graduation_year,
      };
    }
  }

  // 参加前後のアクティビティ比較（企業登録数）
  const heldAt = new Date(eventRes.data.held_at);
  const before30 = new Date(heldAt.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const after30 = new Date(heldAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  let activityStats = { beforeAvg: 0, afterAvg: 0 };
  if (studentIds.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("user_id, created_at")
      .in("user_id", studentIds)
      .gte("created_at", before30)
      .lte("created_at", after30);

    const beforeCounts: Record<string, number> = {};
    const afterCounts: Record<string, number> = {};

    for (const c of companies ?? []) {
      const isAfter = new Date(c.created_at) >= heldAt;
      if (isAfter) {
        afterCounts[c.user_id] = (afterCounts[c.user_id] ?? 0) + 1;
      } else {
        beforeCounts[c.user_id] = (beforeCounts[c.user_id] ?? 0) + 1;
      }
    }

    const beforeTotal = studentIds.reduce((sum, id) => sum + (beforeCounts[id] ?? 0), 0);
    const afterTotal = studentIds.reduce((sum, id) => sum + (afterCounts[id] ?? 0), 0);
    activityStats = {
      beforeAvg: studentIds.length > 0 ? Math.round((beforeTotal / studentIds.length) * 10) / 10 : 0,
      afterAvg: studentIds.length > 0 ? Math.round((afterTotal / studentIds.length) * 10) / 10 : 0,
    };
  }

  return NextResponse.json({
    event: {
      id: eventRes.data.id,
      title: eventRes.data.title,
      eventType: eventRes.data.event_type,
      heldAt: eventRes.data.held_at,
      description: eventRes.data.description,
    },
    attendees: attendees.map((a) => ({
      id: a.id,
      studentUserId: a.student_user_id,
      attendedAt: a.attended_at,
      ...studentInfoMap[a.student_user_id],
    })),
    activityStats,
  });
}

// 出席者登録
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const { studentUserIds } = await req.json();
  if (!Array.isArray(studentUserIds) || studentUserIds.length === 0) {
    return NextResponse.json({ error: "studentUserIds が必要です" }, { status: 400 });
  }

  const supabase = await createClient();

  // イベントが同一大学か確認
  const { data: event } = await supabase
    .from("career_center_events")
    .select("id")
    .eq("id", id)
    .eq("university", staff.university)
    .single();

  if (!event) return NextResponse.json({ error: "イベントが見つかりません" }, { status: 404 });

  const inserts = studentUserIds.map((studentUserId: string) => ({
    event_id: id,
    student_user_id: studentUserId,
    university: staff.university,
  }));

  const { error } = await supabase
    .from("career_center_event_attendances")
    .upsert(inserts, { onConflict: "event_id,student_user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, added: studentUserIds.length });
}
