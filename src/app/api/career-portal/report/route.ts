import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const url = new URL(req.url);
  const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()));
  const month = parseInt(url.searchParams.get("month") ?? String(new Date().getMonth() + 1));

  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59).toISOString();

  const supabase = await createClient();

  const [profilesRes, meetingsRes, companiesRes, reviewsRes] = await Promise.all([
    supabase.from("user_profiles").select("id").eq("university", staff.university),
    supabase
      .from("career_center_meetings")
      .select("id, student_user_id, outcome, met_at")
      .eq("university", staff.university)
      .gte("met_at", startOfMonth.split("T")[0])
      .lte("met_at", endOfMonth.split("T")[0]),
    supabase
      .from("companies")
      .select("user_id, status, created_at"),
    supabase
      .from("es_review_requests")
      .select("id, status, created_at")
      .eq("university", staff.university)
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth),
  ]);

  const profiles = profilesRes.data ?? [];
  const meetings = meetingsRes.data ?? [];
  const companies = companiesRes.data ?? [];
  const reviews = reviewsRes.data ?? [];

  const studentIds = profiles.map((p) => p.id);

  // 面談あり学生 vs なし学生の内定率比較
  const meetingStudentIds = new Set(meetings.map((m) => m.student_user_id));
  const offeredStudents = new Set(
    companies.filter((c) => c.status === "OFFERED").map((c) => c.user_id)
  );

  const withMeetingCount = [...meetingStudentIds].filter((id) => studentIds.includes(id)).length;
  const withMeetingOffered = [...meetingStudentIds].filter(
    (id) => studentIds.includes(id) && offeredStudents.has(id)
  ).length;

  const withoutMeetingIds = studentIds.filter((id) => !meetingStudentIds.has(id));
  const withoutMeetingOffered = withoutMeetingIds.filter((id) => offeredStudents.has(id)).length;

  const withMeetingOfferRate = withMeetingCount > 0
    ? Math.round((withMeetingOffered / withMeetingCount) * 100) : 0;
  const withoutMeetingOfferRate = withoutMeetingIds.length > 0
    ? Math.round((withoutMeetingOffered / withoutMeetingIds.length) * 100) : 0;

  // 当月の新規企業登録数
  const newCompaniesThisMonth = companies.filter(
    (c) => studentIds.includes(c.user_id) &&
      c.created_at >= startOfMonth && c.created_at <= endOfMonth
  ).length;

  // 面談アウトカム内訳
  const outcomeMap: Record<string, number> = {};
  for (const m of meetings) {
    outcomeMap[m.outcome] = (outcomeMap[m.outcome] ?? 0) + 1;
  }

  return NextResponse.json({
    period: { year, month },
    totalStudents: studentIds.length,
    meetingSummary: {
      totalMeetings: meetings.length,
      uniqueStudents: withMeetingCount,
      outcomes: outcomeMap,
    },
    offerRateComparison: {
      withMeeting: { count: withMeetingCount, offerRate: withMeetingOfferRate },
      withoutMeeting: { count: withoutMeetingIds.length, offerRate: withoutMeetingOfferRate },
    },
    esReviewSummary: {
      total: reviews.length,
      completed: reviews.filter((r) => r.status === "staff_done" || r.status === "closed").length,
    },
    newCompaniesRegistered: newCompaniesThisMonth,
    overallOfferRate: studentIds.length > 0
      ? Math.round((offeredStudents.size / studentIds.length) * 100) : 0,
  });
}
