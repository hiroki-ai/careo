import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function formatJST(isoString: string): string {
  return new Date(isoString).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit'
  });
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;
  const { user } = auth;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointment_bookings")
    .select(`
      *,
      appointment_slots (
        id,
        staff_id,
        staff_email,
        university,
        starts_at,
        duration_minutes,
        max_bookings,
        notes,
        is_cancelled,
        created_at
      )
    `)
    .eq("student_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bookings = (data ?? []).map((b) => ({
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
    slot: b.appointment_slots
      ? {
          id: b.appointment_slots.id,
          staffId: b.appointment_slots.staff_id,
          staffEmail: b.appointment_slots.staff_email,
          university: b.appointment_slots.university,
          startsAt: b.appointment_slots.starts_at,
          durationMinutes: b.appointment_slots.duration_minutes,
          maxBookings: b.appointment_slots.max_bookings,
          notes: b.appointment_slots.notes,
          isCancelled: b.appointment_slots.is_cancelled,
          createdAt: b.appointment_slots.created_at,
        }
      : null,
  }));

  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;
  const { user } = auth;

  const { slotId, studentMessage } = await req.json();
  if (!slotId) {
    return NextResponse.json({ error: "slotId が必要です" }, { status: 400 });
  }

  const supabase = await createClient();

  // スロット情報取得
  const { data: slot } = await supabase
    .from("appointment_slots")
    .select("*")
    .eq("id", slotId)
    .eq("is_cancelled", false)
    .single();

  if (!slot) {
    return NextResponse.json({ error: "スロットが見つかりません" }, { status: 404 });
  }

  // 定員チェック
  const { data: confirmedBookings } = await supabase
    .from("appointment_bookings")
    .select("id")
    .eq("slot_id", slotId)
    .eq("status", "confirmed");

  if ((confirmedBookings ?? []).length >= slot.max_bookings) {
    return NextResponse.json({ error: "この枠は満席です" }, { status: 400 });
  }

  // 既に予約済みか確認
  const { data: existingBooking } = await supabase
    .from("appointment_bookings")
    .select("id, status")
    .eq("slot_id", slotId)
    .eq("student_user_id", user.id)
    .single();

  if (existingBooking && existingBooking.status === "confirmed") {
    return NextResponse.json({ error: "既にこの枠を予約しています" }, { status: 400 });
  }

  // user_profiles から大学情報を取得
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("university, faculty, grade")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
  }

  if (profile.university !== slot.university) {
    return NextResponse.json({ error: "この大学の枠は予約できません" }, { status: 403 });
  }

  // 予約INSERT
  const { data: booking, error } = await supabase
    .from("appointment_bookings")
    .upsert({
      slot_id: slotId,
      student_user_id: user.id,
      university: profile.university,
      student_message: studentMessage ?? null,
      status: "confirmed",
      cancelled_at: null,
      cancelled_reason: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "slot_id,student_user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // メール送信（失敗してもエラーにしない）
  const slotDateStr = formatJST(slot.starts_at);
  try {
    // 学生へ確認メール
    await resend.emails.send({
      from: "Careo <onboarding@resend.dev>",
      to: [user.email ?? ""],
      subject: `【予約確定】キャリアセンター相談 ${slotDateStr}`,
      text: `キャリアセンター相談の予約が確定しました。\n\n日時: ${slotDateStr}\n時間: ${slot.duration_minutes}分\n担当: ${slot.staff_email}\n\n${studentMessage ? `相談内容メモ: ${studentMessage}\n\n` : ""}当日はキャリアセンターへお越しください。`,
    });
  } catch (e) {
    console.error("[appointments/bookings] student email error:", e);
  }
  try {
    // 職員へ通知メール
    await resend.emails.send({
      from: "Careo <onboarding@resend.dev>",
      to: [slot.staff_email],
      subject: `【予約通知】相談枠に予約が入りました ${slotDateStr}`,
      text: `相談枠に予約が入りました。\n\n日時: ${slotDateStr}\n時間: ${slot.duration_minutes}分\n学生メール: ${user.email ?? "不明"}\n学部: ${profile.faculty ?? "不明"} ${profile.grade ?? ""}\n\n${studentMessage ? `相談内容メモ: ${studentMessage}` : ""}`,
    });
  } catch (e) {
    console.error("[appointments/bookings] staff email error:", e);
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      slotId: booking.slot_id,
      studentUserId: booking.student_user_id,
      university: booking.university,
      studentMessage: booking.student_message,
      status: booking.status,
      cancelledAt: booking.cancelled_at,
      cancelledReason: booking.cancelled_reason,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at,
    },
  });
}
