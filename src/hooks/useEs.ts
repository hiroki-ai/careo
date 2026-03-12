"use client";

import { useState, useEffect, useCallback } from "react";
import { ES } from "@/types";
import { createClient } from "@/lib/supabase/client";

function rowToEs(row: Record<string, unknown>, questions: Record<string, unknown>[] = []): ES {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    title: row.title as string,
    deadline: row.deadline as string | undefined,
    status: row.status as ES["status"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    questions: questions.map((q) => ({
      id: q.id as string,
      question: q.question as string,
      answer: q.answer as string,
    })),
  };
}

export function useEs() {
  const [esList, setEsList] = useState<ES[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data: entries } = await supabase
      .from("es_entries")
      .select("*, es_questions(id, question, answer, order_index)")
      .order("updated_at", { ascending: false });
    if (entries) {
      setEsList(entries.map((e) => rowToEs(e, (e.es_questions as Record<string, unknown>[]).sort((a, b) => (a.order_index as number) - (b.order_index as number)))));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addEs = useCallback(async (data: Omit<ES, "id" | "createdAt" | "updatedAt">) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: entry } = await supabase
      .from("es_entries")
      .insert({ company_id: data.companyId, title: data.title, deadline: data.deadline || null, status: data.status, user_id: user!.id })
      .select()
      .single();
    if (!entry) throw new Error("Failed to create ES");

    if (data.questions.length > 0) {
      await supabase.from("es_questions").insert(
        data.questions.map((q, i) => ({ es_id: entry.id, question: q.question, answer: q.answer, order_index: i }))
      );
    }
    const newEs = rowToEs(entry, data.questions.map((q, i) => ({ ...q, order_index: i })));
    setEsList((prev) => [newEs, ...prev]);
    return newEs;
  }, []);

  const updateEs = useCallback(async (id: string, data: Partial<ES>) => {
    await supabase.from("es_entries").update({
      company_id: data.companyId,
      title: data.title,
      deadline: data.deadline || null,
      status: data.status,
    }).eq("id", id);

    if (data.questions) {
      await supabase.from("es_questions").delete().eq("es_id", id);
      if (data.questions.length > 0) {
        await supabase.from("es_questions").insert(
          data.questions.map((q, i) => ({ es_id: id, question: q.question, answer: q.answer, order_index: i }))
        );
      }
    }
    await fetch();
  }, [fetch]);

  const deleteEs = useCallback(async (id: string) => {
    await supabase.from("es_entries").delete().eq("id", id);
    setEsList((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getEsById = useCallback((id: string) => esList.find((e) => e.id === id), [esList]);
  const getEsByCompany = useCallback((companyId: string) => esList.filter((e) => e.companyId === companyId), [esList]);

  return { esList, loading, addEs, updateEs, deleteEs, getEsById, getEsByCompany };
}
