"use client";

import { useState, useEffect, useCallback } from "react";
import { AptitudeTest } from "@/types";
import { createClient } from "@/lib/supabase/client";

function rowToTest(row: Record<string, unknown>): AptitudeTest {
  return {
    id: row.id as string,
    companyName: row.company_name as string,
    companyId: row.company_id as string | undefined,
    testType: row.test_type as AptitudeTest["testType"],
    testDate: row.test_date as string | undefined,
    scoreVerbal: row.score_verbal as number | undefined,
    scoreNonverbal: row.score_nonverbal as number | undefined,
    scoreEnglish: row.score_english as number | undefined,
    result: row.result as AptitudeTest["result"],
    notes: row.notes as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useAptitudeTests() {
  const [tests, setTests] = useState<AptitudeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("aptitude_tests")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTests(data.map(rowToTest));
    setLoading(false);
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const addTest = useCallback(async (data: Omit<AptitudeTest, "id" | "createdAt" | "updatedAt">) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase
      .from("aptitude_tests")
      .insert({
        user_id: user!.id,
        company_name: data.companyName,
        company_id: data.companyId ?? null,
        test_type: data.testType,
        test_date: data.testDate ?? null,
        score_verbal: data.scoreVerbal ?? null,
        score_nonverbal: data.scoreNonverbal ?? null,
        score_english: data.scoreEnglish ?? null,
        result: data.result,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (!error && inserted) {
      setTests((prev) => [rowToTest(inserted as Record<string, unknown>), ...prev]);
    }
    return !error;
  }, []);

  const deleteTest = useCallback(async (id: string) => {
    await supabase.from("aptitude_tests").delete().eq("id", id);
    setTests((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tests, loading, addTest, deleteTest, refetch: fetchTests };
}
