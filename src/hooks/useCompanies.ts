"use client";

import { useState, useEffect, useCallback } from "react";
import { Company, CompanyStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setCompanies(data as Company[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addCompany = useCallback(async (data: Omit<Company, "id" | "createdAt" | "updatedAt">) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted } = await supabase
      .from("companies")
      .insert({ ...data, user_id: user!.id })
      .select()
      .single();
    if (inserted) setCompanies((prev) => [inserted as Company, ...prev]);
    return inserted as Company;
  }, []);

  const updateCompany = useCallback(async (id: string, data: Partial<Company>) => {
    const { data: updated } = await supabase
      .from("companies")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (updated) setCompanies((prev) => prev.map((c) => c.id === id ? updated as Company : c));
  }, []);

  const deleteCompany = useCallback(async (id: string) => {
    await supabase.from("companies").delete().eq("id", id);
    setCompanies((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateStatus = useCallback((id: string, status: CompanyStatus) => {
    updateCompany(id, { status });
  }, [updateCompany]);

  const getCompanyById = useCallback((id: string) => companies.find((c) => c.id === id), [companies]);

  const bulkAddCompanies = useCallback(async (rows: Omit<Company, "id" | "createdAt" | "updatedAt">[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted } = await supabase
      .from("companies")
      .insert(rows.map(r => ({ ...r, user_id: user!.id })))
      .select();
    if (inserted) setCompanies((prev) => [...(inserted as Company[]), ...prev]);
    return inserted as Company[];
  }, []);

  return { companies, loading, addCompany, updateCompany, deleteCompany, updateStatus, getCompanyById, bulkAddCompanies };
}
