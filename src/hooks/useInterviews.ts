"use client";

import { useState, useEffect, useCallback } from "react";
import { Interview } from "@/types";
import { getInterviews, saveInterviews } from "@/lib/storage";
import { generateId } from "@/lib/utils";

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    setInterviews(getInterviews());
  }, []);

  const addInterview = useCallback(
    (data: Omit<Interview, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const newInterview: Interview = {
        ...data,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...interviews, newInterview];
      setInterviews(updated);
      saveInterviews(updated);
      return newInterview;
    },
    [interviews]
  );

  const updateInterview = useCallback(
    (id: string, data: Partial<Omit<Interview, "id" | "createdAt">>) => {
      const updated = interviews.map((i) =>
        i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i
      );
      setInterviews(updated);
      saveInterviews(updated);
    },
    [interviews]
  );

  const deleteInterview = useCallback(
    (id: string) => {
      const updated = interviews.filter((i) => i.id !== id);
      setInterviews(updated);
      saveInterviews(updated);
    },
    [interviews]
  );

  const getInterviewById = useCallback(
    (id: string) => interviews.find((i) => i.id === id),
    [interviews]
  );

  const getInterviewsByCompany = useCallback(
    (companyId: string) =>
      interviews
        .filter((i) => i.companyId === companyId)
        .sort((a, b) => a.round - b.round),
    [interviews]
  );

  return {
    interviews,
    addInterview,
    updateInterview,
    deleteInterview,
    getInterviewById,
    getInterviewsByCompany,
  };
}
