import { NextRequest, NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const { id: studentId } = await params;
  const supabase = await createClient();

  // プロフィール取得（同一大学か確認）
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select(`
      id, university, faculty, grade, graduation_year,
      job_search_stage, target_industries, target_jobs,
      career_axis, self_pr, strengths, weaknesses,
      career_center_visibility, created_at
    `)
    .eq("id", studentId)
    .eq("university", staff.university)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "学生が見つかりません" }, { status: 404 });
  }

  const vis = profile.career_center_visibility as Record<string, boolean> | null;

  // アクセスログ記録
  await supabase.from("career_center_access_logs").insert({
    staff_id: staff.id,
    student_user_id: studentId,
    university: staff.university,
  });

  // 各データ取得（visibility に従って取得・マスク）
  const [{ data: companies }, { data: obVisits }, { data: aptitudeTests }] = await Promise.all([
    vis?.companies !== false
      ? supabase.from("companies").select("id, name, industry, status").eq("user_id", studentId)
      : { data: null },
    vis?.obVisits !== false
      ? supabase.from("ob_visits").select("id, company_name, visited_at, purpose, impression").eq("user_id", studentId).order("visited_at", { ascending: false })
      : { data: null },
    vis?.aptitudeTests !== false
      ? supabase.from("aptitude_tests").select("id, company_name, test_type, result, score_verbal, score_nonverbal").eq("user_id", studentId)
      : { data: null },
  ]);

  const student = {
    userId: profile.id,
    email: "",
    university: profile.university,
    faculty: profile.faculty,
    grade: profile.grade,
    graduationYear: profile.graduation_year,
    jobSearchStage: profile.job_search_stage,
    targetIndustries: vis?.targetIndustriesJobs !== false ? (profile.target_industries ?? []) : null,
    targetJobs: vis?.targetIndustriesJobs !== false ? (profile.target_jobs ?? []) : null,
    careerCenterVisibility: vis ?? {},
    // 自己分析（ES・自己分析 visibility）
    careerAxis: vis?.esSelfAnalysis !== false ? profile.career_axis : null,
    selfPr: vis?.esSelfAnalysis !== false ? profile.self_pr : null,
    strengths: vis?.esSelfAnalysis !== false ? profile.strengths : null,
    weaknesses: vis?.esSelfAnalysis !== false ? profile.weaknesses : null,
    // 企業
    companies: companies
      ? companies.map((c) => ({
          id: c.id,
          name: c.name,
          industry: c.industry,
          status: c.status,
        }))
      : null,
    companiesCount: companies ? companies.length : -1,
    offeredCount: companies
      ? (vis?.offerStatus !== false ? companies.filter((c) => c.status === "OFFERED").length : -1)
      : -1,
    // OB訪問
    obVisits: obVisits
      ? obVisits.map((o) => ({
          id: o.id,
          companyName: o.company_name,
          visitedAt: o.visited_at,
          purpose: o.purpose,
          impression: o.impression,
        }))
      : null,
    obVisitCount: obVisits ? obVisits.length : -1,
    // 筆記試験
    aptitudeTests: aptitudeTests
      ? aptitudeTests.map((t) => ({
          id: t.id,
          companyName: t.company_name,
          testType: t.test_type,
          result: t.result,
          scoreVerbal: t.score_verbal,
          scoreNonverbal: t.score_nonverbal,
        }))
      : null,
    createdAt: profile.created_at,
  };

  return NextResponse.json({ student });
}
