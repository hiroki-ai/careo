"use client";

import { useState, useEffect, useCallback } from "react";
import { InterviewRecording, InterviewAIFeedback } from "@/types";
import { createClient } from "@/lib/supabase/client";

function rowToRecording(row: Record<string, unknown>): InterviewRecording {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    interviewId: (row.interview_id as string) ?? null,
    companyName: (row.company_name as string) ?? null,
    recordingType: row.recording_type as InterviewRecording["recordingType"],
    transcript: (row.transcript as string) ?? null,
    aiFeedback: (row.ai_feedback as InterviewAIFeedback) ?? null,
    durationSeconds: (row.duration_seconds as number) ?? null,
    status: row.status as InterviewRecording["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useInterviewRecordings() {
  const [recordings, setRecordings] = useState<InterviewRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("interview_recordings")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setRecordings(data.map((r) => rowToRecording(r as Record<string, unknown>)));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addRecording = useCallback(async (data: {
    interviewId?: string | null;
    companyName?: string | null;
    recordingType: InterviewRecording["recordingType"];
    transcript?: string | null;
    durationSeconds?: number | null;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: row } = await supabase
      .from("interview_recordings")
      .insert({
        user_id: user!.id,
        interview_id: data.interviewId || null,
        company_name: data.companyName || null,
        recording_type: data.recordingType,
        transcript: data.transcript || null,
        duration_seconds: data.durationSeconds || null,
        status: "pending",
      })
      .select()
      .single();
    if (!row) throw new Error("Failed to create recording");
    const newRec = rowToRecording(row as Record<string, unknown>);
    setRecordings((prev) => [newRec, ...prev]);
    return newRec;
  }, []);

  const updateRecording = useCallback(async (id: string, updates: {
    transcript?: string | null;
    aiFeedback?: InterviewAIFeedback | null;
    status?: InterviewRecording["status"];
  }) => {
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.transcript !== undefined) updateData.transcript = updates.transcript;
    if (updates.aiFeedback !== undefined) updateData.ai_feedback = updates.aiFeedback;
    if (updates.status !== undefined) updateData.status = updates.status;

    await supabase.from("interview_recordings").update(updateData).eq("id", id);
    setRecordings((prev) => prev.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: updateData.updated_at as string } : r
    ));
  }, []);

  const deleteRecording = useCallback(async (id: string) => {
    await supabase.from("interview_recordings").delete().eq("id", id);
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { recordings, loading, addRecording, updateRecording, deleteRecording, fetch };
}
