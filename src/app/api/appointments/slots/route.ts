import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;
  const { user } = auth;

  const supabase = await createClient();

  // user_profiles から大学を取得
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("university")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
  }

  const now = new Date().toISOString();

  // 自大学の利用可能スロット一覧を取得
  const { data: slots, error } = await supabase
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
    .eq("university", profile.university)
    .eq("is_cancelled", false)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = (slots ?? []).map((slot) => {
    const allBookings = (slot.appointment_bookings ?? []) as Array<{
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
    }>;

    const confirmedBookings = allBookings.filter((b) => b.status === "confirmed");
    const myBooking = allBookings.find((b) => b.student_user_id === user.id) ?? null;

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
      availableCount: slot.max_bookings - confirmedBookings.length,
      myBooking: myBooking
        ? {
            id: myBooking.id,
            slotId: myBooking.slot_id,
            studentUserId: myBooking.student_user_id,
            university: myBooking.university,
            studentMessage: myBooking.student_message,
            status: myBooking.status,
            cancelledAt: myBooking.cancelled_at,
            cancelledReason: myBooking.cancelled_reason,
            createdAt: myBooking.created_at,
            updatedAt: myBooking.updated_at,
          }
        : null,
    };
  });

  return NextResponse.json({ slots: result });
}
