"use client";

import { useState, useEffect, useCallback } from "react";
import { Interview, InterviewMood } from "@/types";
import { createClient } from "@/lib/supabase/client";

function rowToInterview(row: Record<string, unknown>, questions: Record<string, unknown>[] = []): Interview {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    round: row.round as number,
    scheduledAt: row.scheduled_at as string,
    interviewers: row.interviewers as string | undefined,
    notes: row.notes as string | undefined,
    result: row.result as Interview["result"],
    mood: row.mood as InterviewMood | undefined,
    isSharedAnonymously: (row.is_shared_anonymously as boolean | undefined) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    questions: questions.map((q) => ({
      id: q.id as string,
      question: q.question as string,
      answer: q.answer as string,
    })),
  };
}

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("interviews")
      .select("*, interview_questions(id, question, answer, order_index)")
      .order("scheduled_at", { ascending: false });
    if (data) {
      setInterviews(data.map((i) => rowToInterview(i, (i.interview_questions as Record<string, unknown>[]).sort((a, b) => (a.order_index as number) - (b.order_index as number)))));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addInterview = useCallback(async (data: Omit<Interview, "id" | "createdAt" | "updatedAt">) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: row } = await supabase
      .from("interviews")
      .insert({ company_id: data.companyId, round: data.round, scheduled_at: data.scheduledAt, interviewers: data.interviewers || null, notes: data.notes || null, result: data.result, mood: data.mood || null, user_id: user!.id })
      .select()
      .single();
    if (!row) throw new Error("Failed to create interview");

    if (data.questions.length > 0) {
      await supabase.from("interview_questions").insert(
        data.questions.map((q, i) => ({ interview_id: row.id, question: q.question, answer: q.answer, order_index: i }))
      );
    }
    const newInterview = rowToInterview(row, data.questions.map((q, i) => ({ ...q, order_index: i })));
    setInterviews((prev) => [newInterview, ...prev]);
    return newInterview;
  }, []);

  const updateInterview = useCallback(async (id: string, data: Partial<Interview>) => {
    const updateFields: Record<string, unknown> = {};
    if (data.companyId !== undefined) updateFields.company_id = data.companyId;
    if (data.round !== undefined) updateFields.round = data.round;
    if (data.scheduledAt !== undefined) updateFields.scheduled_at = data.scheduledAt;
    if (data.interviewers !== undefined) updateFields.interviewers = data.interviewers || null;
    if (data.notes !== undefined) updateFields.notes = data.notes || null;
    if (data.result !== undefined) updateFields.result = data.result;
    if (data.mood !== undefined) updateFields.mood = data.mood ?? null;
    if (data.isSharedAnonymously !== undefined) updateFields.is_shared_anonymously = data.isSharedAnonymously;
    await supabase.from("interviews").update(updateFields).eq("id", id);

    if (data.questions) {
      await supabase.from("interview_questions").delete().eq("interview_id", id);
      if (data.questions.length > 0) {
        await supabase.from("interview_questions").insert(
          data.questions.map((q, i) => ({ interview_id: id, question: q.question, answer: q.answer, order_index: i }))
        );
      }
    }
    await fetch();
  }, [fetch]);

  const deleteInterview = useCallback(async (id: string) => {
    await supabase.from("interviews").delete().eq("id", id);
    setInterviews((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateMood = useCallback(async (id: string, mood: InterviewMood | null) => {
    await supabase.from("interviews").update({ mood }).eq("id", id);
    setInterviews((prev) => prev.map((i) => i.id === id ? { ...i, mood: mood ?? undefined } : i));
  }, [supabase]);

  const getInterviewById = useCallback((id: string) => interviews.find((i) => i.id === id), [interviews]);
  const getInterviewsByCompany = useCallback((companyId: string) => interviews.filter((i) => i.companyId === companyId).sort((a, b) => a.round - b.round), [interviews]);

  return { interviews, loading, addInterview, updateInterview, updateMood, deleteInterview, getInterviewById, getInterviewsByCompany };
}
