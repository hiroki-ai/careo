import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;
  const { id } = await params;

  const body = await req.json();
  const supabase = await createClient();

  // 自大学のスロットか確認
  const { data: slot } = await supabase
    .from("appointment_slots")
    .select("id, university")
    .eq("id", id)
    .eq("university", staff.university)
    .single();

  if (!slot) {
    return NextResponse.json({ error: "スロットが見つかりません" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.isCancelled === "boolean") updates.is_cancelled = body.isCancelled;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await supabase
    .from("appointment_slots")
    .update(updates)
    .eq("id", id)
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;
  const { id } = await params;

  const supabase = await createClient();

  // 自大学のスロットか確認
  const { data: slot } = await supabase
    .from("appointment_slots")
    .select("id, university")
    .eq("id", id)
    .eq("university", staff.university)
    .single();

  if (!slot) {
    return NextResponse.json({ error: "スロットが見つかりません" }, { status: 404 });
  }

  // 予約が存在するか確認
  const { data: bookings } = await supabase
    .from("appointment_bookings")
    .select("id")
    .eq("slot_id", id)
    .eq("status", "confirmed")
    .limit(1);

  if (bookings && bookings.length > 0) {
    return NextResponse.json({ error: "予約が存在するため削除できません。先にキャンセルしてください。" }, { status: 400 });
  }

  const { error } = await supabase
    .from("appointment_slots")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
