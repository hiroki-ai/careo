"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

function rowToMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    role: row.role as "user" | "assistant",
    content: row.content as string,
    createdAt: row.created_at as string,
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data.map((r) => rowToMessage(r as Record<string, unknown>)));
    setLoading(false);
  }, []);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const saveMessage = useCallback(async (role: "user" | "assistant", content: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, role, content })
      .select()
      .single();
    if (data) {
      const msg = rowToMessage(data as Record<string, unknown>);
      setMessages((prev) => [...prev, msg]);
      return msg.id;
    }
    return null;
  }, []);

  const clearHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
  }, []);

  // 直近のユーザー発言をAI分析用に返す（最新10件）
  const recentUserMessages = messages
    .filter((m) => m.role === "user")
    .slice(-10)
    .map((m) => m.content);

  return { messages, loading, saveMessage, clearHistory, recentUserMessages };
}
