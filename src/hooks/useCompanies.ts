"use client";

import { useState, useEffect, useCallback } from "react";
import { Company, CompanyStatus } from "@/types";
import { getCompanies, saveCompanies } from "@/lib/storage";
import { generateId } from "@/lib/utils";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    setCompanies(getCompanies());
  }, []);

  const addCompany = useCallback(
    (data: Omit<Company, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newCompany: Company = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...companies, newCompany];
      setCompanies(updated);
      saveCompanies(updated);
      return newCompany;
    },
    [companies]
  );

  const updateCompany = useCallback(
    (id: string, data: Partial<Omit<Company, "id" | "createdAt">>) => {
      const updated = companies.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
      );
      setCompanies(updated);
      saveCompanies(updated);
    },
    [companies]
  );

  const deleteCompany = useCallback(
    (id: string) => {
      const updated = companies.filter((c) => c.id !== id);
      setCompanies(updated);
      saveCompanies(updated);
    },
    [companies]
  );

  const updateStatus = useCallback(
    (id: string, status: CompanyStatus) => {
      updateCompany(id, { status });
    },
    [updateCompany]
  );

  const getCompanyById = useCallback(
    (id: string) => companies.find((c) => c.id === id),
    [companies]
  );

  return {
    companies,
    addCompany,
    updateCompany,
    deleteCompany,
    updateStatus,
    getCompanyById,
  };
}
