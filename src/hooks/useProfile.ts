"use client";

import { useState, useEffect, useCallback } from "react";
import { UserProfile, JobSearchStage } from "@/types";
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
    };
    const { data: saved } = await supabase
      .from("user_profiles")
      .upsert(row)
      .select()
      .single();
    if (saved) setProfile(rowToProfile(saved as Record<string, unknown>));
  }, []);

  return { profile, loading, saveProfile, refetch: fetch };
}
