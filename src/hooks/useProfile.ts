"use client";

import { useState, useEffect, useCallback } from "react";
import { UserProfile, JobSearchStage, UserPlan, CareerCenterVisibility, DEFAULT_CAREER_CENTER_VISIBILITY } from "@/types";
import { createClient } from "@/lib/supabase/client";

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    university: (row.university as string) ?? "",
    faculty: (row.faculty as string) ?? "",
    grade: row.grade as string,
    graduationYear: row.graduation_year as number,
    targetIndustries: (row.target_industries as string[]) ?? [],
    targetJobs: (row.target_jobs as string[]) ?? [],
    jobSearchStage: row.job_search_stage as JobSearchStage,
    plan: ((row.plan as string) ?? "free") as UserPlan,
    careerAxis: (row.career_axis as string) ?? "",
    gakuchika: (row.gakuchika as string) ?? "",
    selfPr: (row.self_pr as string) ?? "",
    strengths: (row.strengths as string) ?? "",
    weaknesses: (row.weaknesses as string) ?? "",
    aiSelfAnalysis: (row.ai_self_analysis as UserProfile["aiSelfAnalysis"]) ?? {},
    careerCenterVisibility: (row.career_center_visibility as CareerCenterVisibility) ?? DEFAULT_CAREER_CENTER_VISIBILITY,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
    setProfile(data ? rowToProfile(data as Record<string, unknown>) : null);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const saveProfile = useCallback(async (data: Omit<UserProfile, "id" | "createdAt" | "updatedAt">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const row = {
      id: user.id,
      university: data.university,
      faculty: data.faculty,
      grade: data.grade,
      graduation_year: data.graduationYear,
      target_industries: data.targetIndustries,
      target_jobs: data.targetJobs,
      job_search_stage: data.jobSearchStage,
      career_axis: data.careerAxis ?? "",
      gakuchika: data.gakuchika ?? "",
      self_pr: data.selfPr ?? "",
      strengths: data.strengths ?? "",
      weaknesses: data.weaknesses ?? "",
    };
    const { data: saved } = await supabase
      .from("user_profiles")
      .upsert(row)
      .select()
      .single();
    if (saved) setProfile(rowToProfile(saved as Record<string, unknown>));
  }, []);

  // 自己分析フィールドだけ部分更新（ユーザー入力。他のプロフィール情報を上書きしない）
  const patchSelfAnalysis = useCallback(async (
    fields: Partial<Pick<UserProfile, "careerAxis" | "gakuchika" | "selfPr" | "strengths" | "weaknesses">>
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const fieldMap: Record<string, string> = {
      careerAxis: "career_axis",
      gakuchika: "gakuchika",
      selfPr: "self_pr",
      strengths: "strengths",
      weaknesses: "weaknesses",
    };
    const row: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) row[fieldMap[key]] = value as string;
    }
    const { data: saved } = await supabase
      .from("user_profiles")
      .update(row)
      .eq("id", user.id)
      .select()
      .single();
    if (saved) setProfile(rowToProfile(saved as Record<string, unknown>));
    return !!saved;
  }, []);

  // AIがチャットで生成した自己分析を別フィールド(ai_self_analysis)に保存
  // ユーザーが手入力した情報は一切上書きしない
  const saveAiSelfAnalysis = useCallback(async (
    fields: Partial<NonNullable<UserProfile["aiSelfAnalysis"]>>
  ): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    // 現在のai_self_analysisとマージ
    const current = (await supabase
      .from("user_profiles")
      .select("ai_self_analysis")
      .eq("id", user.id)
      .single()
    ).data?.ai_self_analysis as UserProfile["aiSelfAnalysis"] ?? {};
    const merged = { ...current, ...fields };
    const { data: saved } = await supabase
      .from("user_profiles")
      .update({ ai_self_analysis: merged })
      .eq("id", user.id)
      .select()
      .single();
    if (saved) setProfile(rowToProfile(saved as Record<string, unknown>));
    return !!saved;
  }, []);

  const saveCareerCenterVisibility = useCallback(async (visibility: CareerCenterVisibility): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: saved } = await supabase
      .from("user_profiles")
      .update({ career_center_visibility: visibility })
      .eq("id", user.id)
      .select()
      .single();
    if (saved) setProfile(rowToProfile(saved as Record<string, unknown>));
    return !!saved;
  }, []);

  return { profile, loading, saveProfile, patchSelfAnalysis, saveAiSelfAnalysis, saveCareerCenterVisibility, refetch: fetch };
}
