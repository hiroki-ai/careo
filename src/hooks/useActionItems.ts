"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ActionItem {
  id: string;
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
}

function rowToItem(row: Record<string, unknown>): ActionItem {
  return {
    id: row.id as string,
    action: row.action as string,
    reason: (row.reason as string) ?? "",
    priority: row.priority as "high" | "medium" | "low",
    isCompleted: row.is_completed as boolean,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | undefined,
  };
}

export function useActionItems() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("action_items")
      .select("*")
      .order("is_completed", { ascending: true })
      .order("created_at", { ascending: false });
    if (data) setItems(data.map((r) => rowToItem(r as Record<string, unknown>)));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const replaceItems = useCallback(async (
    newItems: { action: string; reason: string; priority: "high" | "medium" | "low" }[]
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // 未完了のものだけ削除して新しいものに差し替え
    await supabase.from("action_items").delete().eq("user_id", user.id).eq("is_completed", false);
    if (newItems.length > 0) {
      await supabase.from("action_items").insert(
        newItems.map((item) => ({ ...item, user_id: user.id, is_completed: false }))
      );
    }
    await fetch();
  }, [fetch]);

  const toggleItem = useCallback(async (id: string, isCompleted: boolean) => {
    await supabase.from("action_items").update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    }).eq("id", id);
    setItems((prev) => prev.map((item) =>
      item.id === id ? { ...item, isCompleted, completedAt: isCompleted ? new Date().toISOString() : undefined } : item
    ));
  }, []);

  // 既存アイテムを保持したまま新しいアクションを追加（チャット連携用）
  const addItems = useCallback(async (
    newItems: { action: string; reason: string; priority: "high" | "medium" | "low" }[]
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || newItems.length === 0) return;
    // 未完了の既存アクションと重複しないものだけ追加
    const existingActions = items.filter(i => !i.isCompleted).map(i => i.action);
    const toAdd = newItems.filter(item =>
      !existingActions.some(a => a.includes(item.action.slice(0, 10)))
    );
    if (toAdd.length === 0) return;
    await supabase.from("action_items").insert(
      toAdd.map(item => ({ ...item, user_id: user.id, is_completed: false }))
    );
    await fetch();
  }, [items, fetch]);

  const completedItems = items.filter((i) => i.isCompleted);
  const pendingItems = items.filter((i) => !i.isCompleted);

  return { items, pendingItems, completedItems, loading, replaceItems, addItems, toggleItem };
}
