"use client";

import { useState, useEffect, useCallback } from "react";
import { ObVisit } from "@/types";
import { createClient } from "@/lib/supabase/client";

function rowToObVisit(row: Record<string, unknown>): ObVisit {
  return {
    id: row.id as string,
    companyName: row.company_name as string,
    companyId: row.company_id as string | undefined,
    personName: row.person_name as string | undefined,
    visitedAt: row.visited_at as string,
    purpose: row.purpose as ObVisit["purpose"],
    insights: row.insights as string | undefined,
    impression: row.impression as ObVisit["impression"] | undefined,
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useObVisits() {
  const [visits, setVisits] = useState<ObVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ob_visits")
      .select("*")
      .order("visited_at", { ascending: false });
    if (!error && data) setVisits(data.map(rowToObVisit));
    setLoading(false);
  }, []);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const addVisit = useCallback(async (data: Omit<ObVisit, "id" | "createdAt" | "updatedAt">) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase
      .from("ob_visits")
      .insert({
        user_id: user!.id,
        company_name: data.companyName,
        company_id: data.companyId ?? null,
        person_name: data.personName ?? null,
        visited_at: data.visitedAt,
        purpose: data.purpose,
        insights: data.insights ?? null,
        impression: data.impression ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (!error && inserted) {
      setVisits((prev) => [rowToObVisit(inserted as Record<string, unknown>), ...prev]);
    }
    return !error;
  }, []);

  const updateVisit = useCallback(async (id: string, data: Partial<ObVisit>) => {
    const { error } = await supabase
      .from("ob_visits")
      .update({
        company_name: data.companyName,
        person_name: data.personName ?? null,
        visited_at: data.visitedAt,
        purpose: data.purpose,
        insights: data.insights ?? null,
        impression: data.impression ?? null,
        notes: data.notes ?? null,
      })
      .eq("id", id);
    if (!error) await fetchVisits();
    return !error;
  }, [fetchVisits]);

  const deleteVisit = useCallback(async (id: string) => {
    await supabase.from("ob_visits").delete().eq("id", id);
    setVisits((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { visits, loading, addVisit, updateVisit, deleteVisit, refetch: fetchVisits };
}
