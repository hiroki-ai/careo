import { NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, faculty, grade, graduation_year, target_industries, career_center_visibility, last_active_at")
    .eq("university", staff.university);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ totalStudents: 0, byFaculty: [], byGradYear: [], industryRanking: [], activeRate: 0, inactiveCount: 0 });
  }

  const studentIds = profiles.map((p) => p.id);

  const [companiesRes, interviewsRes] = await Promise.all([
    supabase.from("companies").select("user_id, status, industry").in("user_id", studentIds),
    supabase.from("interviews").select("user_id, result").in("user_id", studentIds),
  ]);

  const companies = companiesRes.data ?? [];
  const interviews = interviewsRes.data ?? [];

  // 学部別集計
  const facultyMap: Record<string, { count: number; offered: number }> = {};
  for (const p of profiles) {
    if (!facultyMap[p.faculty]) facultyMap[p.faculty] = { count: 0, offered: 0 };
    facultyMap[p.faculty].count++;
  }
  const offeredByUser = new Set(companies.filter((c) => c.status === "OFFERED").map((c) => c.user_id));
  for (const p of profiles) {
    if (offeredByUser.has(p.id)) facultyMap[p.faculty].offered++;
  }
  const byFaculty = Object.entries(facultyMap)
    .map(([faculty, { count, offered }]) => ({
      faculty,
      count,
      offered,
      offerRate: count > 0 ? Math.round((offered / count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // 卒業年度別
  const gradYearMap: Record<number, number> = {};
  for (const p of profiles) {
    gradYearMap[p.graduation_year] = (gradYearMap[p.graduation_year] ?? 0) + 1;
  }
  const byGradYear = Object.entries(gradYearMap)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => a.year - b.year);

  // 業界別応募数ランキング（visibility尊重）
  const industryMap: Record<string, number> = {};
  for (const c of companies) {
    if (!c.industry) continue;
    industryMap[c.industry] = (industryMap[c.industry] ?? 0) + 1;
  }
  const industryRanking = Object.entries(industryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([industry, count]) => ({ industry, count }));

  // 面接通過率
  const passedInterviews = interviews.filter((i) => i.result === "PASS").length;
  const interviewPassRate = interviews.length > 0
    ? Math.round((passedInterviews / interviews.length) * 100)
    : 0;

  // 非アクティブ学生数（30日以上未ログイン）
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const inactiveCount = profiles.filter((p) => {
    if (!p.last_active_at) return true;
    return new Date(p.last_active_at) < thirtyDaysAgo;
  }).length;

  const activeRate = profiles.length > 0
    ? Math.round(((profiles.length - inactiveCount) / profiles.length) * 100)
    : 0;

  // 選考ステータス分布
  const statusMap: Record<string, number> = {};
  for (const c of companies) {
    statusMap[c.status] = (statusMap[c.status] ?? 0) + 1;
  }

  return NextResponse.json({
    totalStudents: profiles.length,
    byFaculty,
    byGradYear,
    industryRanking,
    interviewPassRate,
    activeRate,
    inactiveCount,
    statusDistribution: statusMap,
    totalCompanies: companies.length,
    totalInterviews: interviews.length,
    offeredCount: offeredByUser.size,
    offerRate: profiles.length > 0 ? Math.round((offeredByUser.size / profiles.length) * 100) : 0,
  });
}
