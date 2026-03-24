import { NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const supabase = await createClient();

  // 同一大学の学生プロフィール一覧
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("id, grade, graduation_year, job_search_stage, target_industries, career_center_visibility")
    .eq("university", staff.university);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({
      totalStudents: 0,
      byGradYear: [],
      byStage: [],
      topIndustries: [],
      offerRate: 0,
    });
  }

  const studentIds = profiles.map((p) => p.id);

  // 企業データ集計
  const { data: companies } = await supabase
    .from("companies")
    .select("user_id, status")
    .in("user_id", studentIds);

  const totalStudents = profiles.length;

  // 卒業年度別
  const gradYearMap: Record<number, number> = {};
  for (const p of profiles) {
    gradYearMap[p.graduation_year] = (gradYearMap[p.graduation_year] ?? 0) + 1;
  }
  const byGradYear = Object.entries(gradYearMap)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => a.year - b.year);

  // 就活ステージ別
  const stageMap: Record<string, number> = {};
  for (const p of profiles) {
    stageMap[p.job_search_stage] = (stageMap[p.job_search_stage] ?? 0) + 1;
  }
  const byStage = Object.entries(stageMap).map(([stage, count]) => ({ stage, count }));

  // 志望業界TOP5
  const industryMap: Record<string, number> = {};
  for (const p of profiles) {
    const vis = p.career_center_visibility as Record<string, boolean> | null;
    if (vis?.targetIndustriesJobs === false) continue;
    for (const ind of (p.target_industries ?? [])) {
      industryMap[ind] = (industryMap[ind] ?? 0) + 1;
    }
  }
  const topIndustries = Object.entries(industryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([industry, count]) => ({ industry, count }));

  // 内定率（OFFERED を持つ学生数 / 全学生数）
  const offeredStudents = new Set(
    (companies ?? []).filter((c) => c.status === "OFFERED").map((c) => c.user_id)
  ).size;
  const offerRate = totalStudents > 0 ? Math.round((offeredStudents / totalStudents) * 100) : 0;

  // 企業登録ゼロの学生（要注意）
  const studentsWithCompanies = new Set((companies ?? []).map((c) => c.user_id));
  const notStartedCount = profiles.filter((p) => !studentsWithCompanies.has(p.id)).length;

  return NextResponse.json({
    totalStudents,
    byGradYear,
    byStage,
    topIndustries,
    offerRate,
    offeredCount: offeredStudents,
    notStartedCount,
  });
}
