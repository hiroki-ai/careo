import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getShukatsuContext } from "@/lib/shukatsuSchedule";

export const maxDuration = 60;

// Vercel Cron: 毎日1時（JST）= 16:00 UTC
// vercel.json: "crons": [{ "path": "/api/cron/career-alerts", "schedule": "0 16 * * *" }]

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // 全学生プロフィール取得（RLSバイパス）
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, university, graduation_year, last_active_at");

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // 企業データ取得
  const { data: companies } = await supabase
    .from("companies")
    .select("user_id, status");

  const companyMap: Record<string, string[]> = {};
  for (const c of companies ?? []) {
    if (!companyMap[c.user_id]) companyMap[c.user_id] = [];
    companyMap[c.user_id].push(c.status);
  }

  const alertsToUpsert: {
    university: string;
    student_user_id: string;
    alert_type: string;
    alert_detail: Record<string, unknown>;
    is_resolved: boolean;
  }[] = [];

  for (const profile of profiles) {
    const { isInternPhase } = getShukatsuContext(profile.graduation_year, now);
    const studentCompanies = companyMap[profile.id] ?? [];

    // アラート1: 30日以上未ログイン
    if (!profile.last_active_at || new Date(profile.last_active_at) < new Date(thirtyDaysAgo)) {
      const daysSince = profile.last_active_at
        ? Math.floor((now.getTime() - new Date(profile.last_active_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      alertsToUpsert.push({
        university: profile.university,
        student_user_id: profile.id,
        alert_type: "inactive_30d",
        alert_detail: { daysSinceLogin: daysSince },
        is_resolved: false,
      });
    }

    // アラート2: 本選考期なのに企業登録なし
    if (!isInternPhase && studentCompanies.length === 0) {
      alertsToUpsert.push({
        university: profile.university,
        student_user_id: profile.id,
        alert_type: "no_companies_late",
        alert_detail: { graduationYear: profile.graduation_year },
        is_resolved: false,
      });
    }

    // アラート3: 直近5社が全て不合格
    if (studentCompanies.length >= 5) {
      const last5 = studentCompanies.slice(-5);
      if (last5.every((s) => s === "REJECTED")) {
        alertsToUpsert.push({
          university: profile.university,
          student_user_id: profile.id,
          alert_type: "consecutive_rejections",
          alert_detail: { consecutiveCount: 5 },
          is_resolved: false,
        });
      }
    }
  }

  if (alertsToUpsert.length > 0) {
    await supabase
      .from("career_center_alerts")
      .upsert(alertsToUpsert, {
        onConflict: "university,student_user_id,alert_type",
        ignoreDuplicates: false,
      });
  }

  return NextResponse.json({
    ok: true,
    processed: profiles.length,
    alertsGenerated: alertsToUpsert.length,
  });
}
