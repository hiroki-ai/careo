"use client";

import { useEffect, useState, useCallback } from "react";
import type { TeamMember } from "@/lib/team/members";

export interface TeamReport {
  id: string;
  member_id: string;
  member_name: string;
  task_type: string;
  headline: string;
  body: string;
  deliverable: string;
  action_label: string;
  status: "pending" | "adopted" | "dismissed";
  created_at: string;
}

export interface TeamMemberWithReport {
  member: TeamMember;
  report: TeamReport | null;
}

export function useTeam() {
  const [data, setData] = useState<TeamMemberWithReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      const json = await res.json();
      setData(json);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerTask = async (memberId: string) => {
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    if (res.ok) await fetchData();
    return res.ok;
  };

  const respond = async (id: string, status: "adopted" | "dismissed") => {
    await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await fetchData();
  };

  return { data, loading, triggerTask, respond, refresh: fetchData };
}
