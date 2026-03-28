"use client";

import { useState, useEffect } from "react";
import { getCoachPersonality, DEFAULT_COACH_ID } from "@/lib/coachPersonalities";
import type { CoachPersonality } from "@/lib/coachPersonalities";
import { createClient } from "@/lib/supabase/client";

export function useCoach(): { coachId: string; coach: CoachPersonality; coachName: string } {
  const [coachId, setCoachId] = useState<string>(DEFAULT_COACH_ID);

  useEffect(() => {
    // まずlocalStorageから即時反映（ちらつき防止）
    const local = localStorage.getItem("careo_coach_id");
    if (local) setCoachId(local);

    // Supabaseから最新値を取得（デバイス間同期）
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_profiles")
        .select("coach_id")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.coach_id) {
            setCoachId(data.coach_id);
            localStorage.setItem("careo_coach_id", data.coach_id);
          }
        });
    });

    // 同一ブラウザ内の別タブでコーチ変更が起きたときに追従
    const handler = (e: StorageEvent) => {
      if (e.key === "careo_coach_id" && e.newValue) setCoachId(e.newValue);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const coach = getCoachPersonality(coachId);
  return { coachId, coach, coachName: coach.name };
}
