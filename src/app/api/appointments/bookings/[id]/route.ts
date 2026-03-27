import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.errorResponse) return auth.errorResponse;
  const { user } = auth;
  const { id } = await params;

  const supabase = await createClient();

  // 自分の予約か確認
  const { data: booking } = await supabase
    .from("appointment_bookings")
    .select("id, student_user_id, status")
    .eq("id", id)
    .eq("student_user_id", user.id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "この予約はキャンセルできません" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("appointment_bookings")
    .update({
      status: "cancelled_by_student",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    booking: {
      id: data.id,
      slotId: data.slot_id,
      studentUserId: data.student_user_id,
      university: data.university,
      studentMessage: data.student_message,
      status: data.status,
      cancelledAt: data.cancelled_at,
      cancelledReason: data.cancelled_reason,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}
