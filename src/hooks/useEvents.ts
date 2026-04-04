"use client";

import { useState, useEffect, useCallback } from "react";
import { CompanyEvent, CompanyEventType, CompanyEventStatus } from "@/types";
import { createClient } from "@/lib/supabase/client";

function rowToEvent(row: Record<string, unknown>): CompanyEvent {
  return {
    id: row.id as string,
    companyId: row.company_id as string | null,
    companyName: row.company_name as string,
    eventType: row.event_type as CompanyEventType,
    scheduledAt: row.scheduled_at as string,
    endDate: row.end_date as string | null,
    location: row.location as string | null,
    url: row.url as string | null,
    notes: row.notes as string | null,
    status: row.status as CompanyEventStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useEvents() {
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("company_events")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });
    if (data) setEvents(data.map(rowToEvent));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addEvent = useCallback(async (data: Omit<CompanyEvent, "id" | "createdAt" | "updatedAt">) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted } = await supabase
      .from("company_events")
      .insert({
        user_id: user!.id,
        company_id: data.companyId ?? null,
        company_name: data.companyName,
        event_type: data.eventType,
        scheduled_at: data.scheduledAt,
        end_date: data.endDate ?? null,
        location: data.location ?? null,
        url: data.url ?? null,
        notes: data.notes ?? null,
        status: data.status,
      })
      .select()
      .single();
    if (inserted) {
      const ev = rowToEvent(inserted as Record<string, unknown>);
      setEvents((prev) => [...prev, ev].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
      return ev;
    }
  }, []);

  const updateEvent = useCallback(async (id: string, data: Partial<Omit<CompanyEvent, "id" | "createdAt" | "updatedAt">>) => {
    const payload: Record<string, unknown> = {};
    if (data.companyId !== undefined) payload.company_id = data.companyId;
    if (data.companyName !== undefined) payload.company_name = data.companyName;
    if (data.eventType !== undefined) payload.event_type = data.eventType;
    if (data.scheduledAt !== undefined) payload.scheduled_at = data.scheduledAt;
    if (data.endDate !== undefined) payload.end_date = data.endDate;
    if (data.location !== undefined) payload.location = data.location;
    if (data.url !== undefined) payload.url = data.url;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.status !== undefined) payload.status = data.status;
    const { data: updated } = await supabase
      .from("company_events")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (updated) {
      const ev = rowToEvent(updated as Record<string, unknown>);
      setEvents((prev) => prev.map((e) => e.id === id ? ev : e));
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await supabase.from("company_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { events, loading, addEvent, updateEvent, deleteEvent, refetch: fetch };
}
