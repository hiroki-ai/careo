"use client";

import { useState, useEffect, useCallback } from "react";
import { CustomEvent, CustomEventColor } from "@/types";
import { createClient } from "@/lib/supabase/client";

function rowToEvent(row: Record<string, unknown>): CustomEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    scheduledAt: row.scheduled_at as string,
    endAt: (row.end_at as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    color: (row.color as CustomEventColor) ?? "gray",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function useCustomEvents() {
  const [customEvents, setCustomEvents] = useState<CustomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("custom_events")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });
    if (data) setCustomEvents(data.map(rowToEvent));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addCustomEvent = useCallback(async (data: Omit<CustomEvent, "id" | "createdAt" | "updatedAt">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: inserted } = await supabase
      .from("custom_events")
      .insert({
        user_id: user.id,
        title: data.title,
        scheduled_at: data.scheduledAt,
        end_at: data.endAt ?? null,
        location: data.location ?? null,
        notes: data.notes ?? null,
        color: data.color,
      })
      .select()
      .single();
    if (inserted) {
      const ev = rowToEvent(inserted as Record<string, unknown>);
      setCustomEvents((prev) => [...prev, ev].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
      return ev;
    }
  }, []);

  const updateCustomEvent = useCallback(async (id: string, data: Partial<Omit<CustomEvent, "id" | "createdAt" | "updatedAt">>) => {
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.scheduledAt !== undefined) payload.scheduled_at = data.scheduledAt;
    if (data.endAt !== undefined) payload.end_at = data.endAt;
    if (data.location !== undefined) payload.location = data.location;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.color !== undefined) payload.color = data.color;
    const { data: updated } = await supabase
      .from("custom_events")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (updated) {
      const ev = rowToEvent(updated as Record<string, unknown>);
      setCustomEvents((prev) => prev.map((e) => e.id === id ? ev : e));
    }
  }, []);

  const deleteCustomEvent = useCallback(async (id: string) => {
    await supabase.from("custom_events").delete().eq("id", id);
    setCustomEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { customEvents, loading, addCustomEvent, updateCustomEvent, deleteCustomEvent, refetch: fetch };
}
