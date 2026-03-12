"use client";

import { useState, useEffect, useCallback } from "react";
import { ES } from "@/types";
import { getEsList, saveEsList } from "@/lib/storage";
import { generateId } from "@/lib/utils";

export function useEs() {
  const [esList, setEsList] = useState<ES[]>([]);

  useEffect(() => {
    setEsList(getEsList());
  }, []);

  const addEs = useCallback(
    (data: Omit<ES, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newEs: ES = { ...data, id: generateId(), createdAt: now, updatedAt: now };
      const updated = [...esList, newEs];
      setEsList(updated);
      saveEsList(updated);
      return newEs;
    },
    [esList]
  );

  const updateEs = useCallback(
    (id: string, data: Partial<Omit<ES, "id" | "createdAt">>) => {
      const updated = esList.map((e) =>
        e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e
      );
      setEsList(updated);
      saveEsList(updated);
    },
    [esList]
  );

  const deleteEs = useCallback(
    (id: string) => {
      const updated = esList.filter((e) => e.id !== id);
      setEsList(updated);
      saveEsList(updated);
    },
    [esList]
  );

  const getEsById = useCallback(
    (id: string) => esList.find((e) => e.id === id),
    [esList]
  );

  const getEsByCompany = useCallback(
    (companyId: string) => esList.filter((e) => e.companyId === companyId),
    [esList]
  );

  return { esList, addEs, updateEs, deleteEs, getEsById, getEsByCompany };
}
