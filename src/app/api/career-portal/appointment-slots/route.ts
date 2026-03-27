import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const now = new Date();
  const fromDate = from ?? now.toISOString();
  const toDate = to ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_slots")
    .select(`
      *,
      appointment_bookings (
        id,
        slot_id,
        student_user_id,
        university,
        student_message,
        status,
        cancelled_at,
        cancelled_reason,
        created_at,
        updated_at
      )
    `)
    .eq("university", staff.university)
    .gte("starts_at", fromDate)
    .lte("starts_at", toDate)
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 予約者情報（user_profiles）を取得して付与
  const allStudentIds = (data ?? []).flatMap((slot) =>
    (slot.appointment_bookings ?? []).map((b: { student_user_id: string }) => b.student_user_id)
  );
  const uniqueStudentIds = [...new Set(allStudentIds)];

  let profileMap: Record<string, { name?: string; faculty?: string; grade?: string }> = {};
  if (uniqueStudentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, faculty, grade")
      .in("id", uniqueStudentIds);
    for (const p of profiles ?? []) {
      profileMap[p.id] = { faculty: p.faculty, grade: p.grade };
    }
    // メールアドレスを auth.users から取得
    const { data: { users } } = await supabase.auth.admin.listUsers();
    for (const u of users ?? []) {
      if (profileMap[u.id]) {
        profileMap[u.id].name = u.email ?? undefined;
      }
    }
  }

  const slots = (data ?? []).map((slot) => {
    const bookings = (slot.appointment_bookings ?? []).map((b: {
      id: string;
      slot_id: string;
      student_user_id: string;
      university: string;
      student_message: string | null;
      status: string;
      cancelled_at: string | null;
      cancelled_reason: string | null;
      created_at: string;
      updated_at: string;
    }) => ({
      id: b.id,
      slotId: b.slot_id,
      studentUserId: b.student_user_id,
      university: b.university,
      studentMessage: b.student_message,
      status: b.status,
      cancelledAt: b.cancelled_at,
      cancelledReason: b.cancelled_reason,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
      studentName: profileMap[b.student_user_id]?.name,
      studentFaculty: profileMap[b.student_user_id]?.faculty,
      studentGrade: profileMap[b.student_user_id]?.grade,
    }));

    return {
      id: slot.id,
      staffId: slot.staff_id,
      staffEmail: slot.staff_email,
      university: slot.university,
      startsAt: slot.starts_at,
      durationMinutes: slot.duration_minutes,
      maxBookings: slot.max_bookings,
      notes: slot.notes,
      isCancelled: slot.is_cancelled,
      createdAt: slot.created_at,
      bookings,
      bookingsCount: bookings.length,
    };
  });

  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { user, staff } = auth;

  const { startsAt, durationMinutes, maxBookings, notes } = await req.json();
  if (!startsAt) {
    return NextResponse.json({ error: "startsAt が必要です" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointment_slots")
    .insert({
      staff_id: staff.id,
      staff_email: user.email ?? "",
      university: staff.university,
      starts_at: startsAt,
      duration_minutes: durationMinutes ?? 30,
      max_bookings: maxBookings ?? 1,
      notes: notes ?? null,
      is_cancelled: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    slot: {
      id: data.id,
      staffId: data.staff_id,
      staffEmail: data.staff_email,
      university: data.university,
      startsAt: data.starts_at,
      durationMinutes: data.duration_minutes,
      maxBookings: data.max_bookings,
      notes: data.notes,
      isCancelled: data.is_cancelled,
      createdAt: data.created_at,
    },
  });
}
