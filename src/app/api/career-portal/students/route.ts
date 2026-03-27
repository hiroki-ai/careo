import { NextResponse } from "next/server";
import { requireCareerCenterStaff } from "@/lib/apiAuth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireCareerCenterStaff();
  if (auth.errorResponse) return auth.errorResponse;
  const { staff } = auth;

  const supabase = await createClient();

  // 同一大学の学生プロフィール
  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select(`
      id,
      university,
      faculty,
      grade,
      graduation_year,
      job_search_stage,
      target_industries,
      target_jobs,
      career_center_visibility,
      created_at
    `)
    .eq("university", staff.university)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ students: [] });
  }

  // 学生一覧アクセスログ（最初の学生IDで代表記録）
  if (profiles[0]) {
    void supabase.from("career_center_access_logs").insert({
      staff_id: staff.id,
      student_user_id: profiles[0].id,
      university: staff.university,
    });
  }

  const studentIds = profiles.map((p) => p.id);

  // 企業・OB訪問・面接の件数を集計
  const [{ data: companies }, { data: obVisits }, { data: interviews }] = await Promise.all([
    supabase.from("companies").select("user_id, status").in("user_id", studentIds),
    supabase.from("ob_visits").select("user_id").in("user_id", studentIds),
    supabase.from("interviews").select("user_id").in("user_id", studentIds),
  ]);

  // auth.users からメールアドレスを取得（service_role_key 必要なので簡略化: emailなし）
  const students = profiles.map((p) => {
    const vis = p.career_center_visibility as Record<string, boolean> | null;
    const userCompanies = (companies ?? []).filter((c) => c.user_id === p.id);
    return {
      userId: p.id,
      email: "", // プライバシー配慮でメールは返さない
      university: p.university,
      faculty: p.faculty,
      grade: p.grade,
      graduationYear: p.graduation_year,
      jobSearchStage: p.job_search_stage,
      targetIndustries: vis?.targetIndustriesJobs !== false ? (p.target_industries ?? []) : [],
      targetJobs: vis?.targetIndustriesJobs !== false ? (p.target_jobs ?? []) : [],
      careerCenterVisibility: p.career_center_visibility ?? {},
      companiesCount: vis?.companies !== false ? userCompanies.length : -1,
      offeredCount: vis?.offerStatus !== false
        ? userCompanies.filter((c) => c.status === "OFFERED").length
        : -1,
      interviewCount: vis?.companies !== false
        ? (interviews ?? []).filter((i) => i.user_id === p.id).length
        : -1,
      obVisitCount: vis?.obVisits !== false
        ? (obVisits ?? []).filter((o) => o.user_id === p.id).length
        : -1,
      createdAt: p.created_at,
    };
  });

  return NextResponse.json({ students });
}
