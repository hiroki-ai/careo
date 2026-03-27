import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const maxDuration = 60;

// Vercel Cron: 毎日0時（JST）= 15:00 UTC
// vercel.json: "crons": [{ "path": "/api/cron/appointment-reminders", "schedule": "0 15 * * *" }]

const resend = new Resend(process.env.RESEND_API_KEY);

function formatJST(isoString: string): string {
  return new Date(isoString).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric', month: 'long', day: 'numeric',
    weekday: 'short', hour: '2-digit', minute: '2-digit'
  });
}

export async function GET(req: NextRequest) {
  // 3-way認証（career-alertsと同じパターン）
  const auth = req.headers.get("authorization");
  const secret = (auth?.startsWith("Bearer ") ? auth.slice(7) : null) ?? req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 翌日JST（UTC+9）の範囲を計算
  const now = new Date();
  // 現在時刻から翌日の始まり・終わり（JST基準）
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const jstTomorrow = new Date(jstNow);
  jstTomorrow.setUTCDate(jstTomorrow.getUTCDate() + 1);
  jstTomorrow.setUTCHours(0, 0, 0, 0);
  const jstTomorrowEnd = new Date(jstTomorrow);
  jstTomorrowEnd.setUTCHours(23, 59, 59, 999);

  // UTC に戻す
  const fromUTC = new Date(jstTomorrow.getTime() - 9 * 60 * 60 * 1000).toISOString();
  const toUTC = new Date(jstTomorrowEnd.getTime() - 9 * 60 * 60 * 1000).toISOString();

  // 翌日の confirmed 予約を取得
  const { data: bookings, error } = await supabase
    .from("appointment_bookings")
    .select(`
      id,
      student_user_id,
      student_message,
      appointment_slots (
        starts_at,
        duration_minutes,
        notes,
        staff_email
      )
    `)
    .eq("status", "confirmed")
    .gte("appointment_slots.starts_at", fromUTC)
    .lte("appointment_slots.starts_at", toUTC);

  if (error) {
    console.error("[appointment-reminders] DB error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!bookings || bookings.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // ユーザーメールアドレス取得
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const userEmailMap: Record<string, string> = {};
  for (const u of users ?? []) {
    if (u.email) userEmailMap[u.id] = u.email;
  }

  let sent = 0;
  for (const booking of bookings) {
    const slotRaw = booking.appointment_slots;
    const slot = (Array.isArray(slotRaw) ? slotRaw[0] : slotRaw) as {
      starts_at: string;
      duration_minutes: number;
      notes: string | null;
      staff_email: string;
    } | null;

    if (!slot) continue;

    const studentEmail = userEmailMap[booking.student_user_id];
    if (!studentEmail) continue;

    const slotDateStr = formatJST(slot.starts_at);

    try {
      await resend.emails.send({
        from: "Careo <onboarding@resend.dev>",
        to: [studentEmail],
        subject: `【リマインダー】明日のキャリアセンター相談 ${slotDateStr}`,
        text: `明日のキャリアセンター相談のリマインダーです。\n\n日時: ${slotDateStr}\n時間: ${slot.duration_minutes}分\n担当: ${slot.staff_email}\n${slot.notes ? `\nメモ: ${slot.notes}\n` : ""}\nお忘れなくご来室ください。`,
      });
      sent++;
    } catch (e) {
      console.error(`[appointment-reminders] email error for ${studentEmail}:`, e);
    }
  }

  return NextResponse.json({ ok: true, sent, total: bookings.length });
}
