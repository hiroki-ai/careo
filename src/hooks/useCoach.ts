import { useState, useEffect } from "react";
import { getCoachPersonality, DEFAULT_COACH_ID } from "@/lib/coachPersonalities";
import type { CoachPersonality } from "@/lib/coachPersonalities";

export function useCoach(): { coachId: string; coach: CoachPersonality; coachName: string } {
  const [coachId, setCoachId] = useState<string>(DEFAULT_COACH_ID);

  useEffect(() => {
    const saved = localStorage.getItem("careo_coach_id");
    if (saved) setCoachId(saved);

    // 同一タブ内でチャットページからコーチ変更が起きたときに追従
    const handler = (e: StorageEvent) => {
      if (e.key === "careo_coach_id" && e.newValue) setCoachId(e.newValue);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const coach = getCoachPersonality(coachId);
  return { coachId, coach, coachName: coach.name };
}
