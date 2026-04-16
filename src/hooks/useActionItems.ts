"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ActionItem {
  id: string;
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
  isCompleted: boolean;
  link?: ActionLink;
  createdAt: string;
  completedAt?: string;
}

export interface ActionLink {
  href: string;
  label: string;
  external: boolean;
}

// アクション文言からリンクを推定。外部サービスが適切なものは外部URLを返す
export function inferActionLink(action: string): ActionLink | undefined {
  const a = action;

  // ── 外部サービスが適切なアクション ──
  if (/マイナビ/i.test(a))
    return { href: "https://job.mynavi.jp/", label: "マイナビ →", external: true };
  if (/リクナビ/i.test(a))
    return { href: "https://job.rikunabi.com/", label: "リクナビ →", external: true };
  if (/キャリタス/i.test(a))
    return { href: "https://job.career-tasu.jp/", label: "キャリタス →", external: true };
  if (/OfferBox|オファーボックス/i.test(a))
    return { href: "https://offerbox.jp/", label: "OfferBox →", external: true };
  if (/Wantedly|ウォンテッドリー/i.test(a))
    return { href: "https://www.wantedly.com/explore", label: "Wantedly →", external: true };
  if (/就活会議/i.test(a))
    return { href: "https://syukatsu-kaigi.jp/", label: "就活会議 →", external: true };
  if (/OpenWork|オープンワーク/i.test(a))
    return { href: "https://www.openwork.jp/", label: "OpenWork →", external: true };
  if (/LinkedIn|リンクトイン/i.test(a))
    return { href: "https://www.linkedin.com/", label: "LinkedIn →", external: true };
  if (/Gmail|就活用メール|就活メール/i.test(a))
    return { href: "https://mail.google.com/mail/u/0/#create", label: "Gmail →", external: true };
  // ── CareoのAI機能で対応できるアクション ──
  if (/ES|エントリーシート|提出/.test(a))
    return { href: "/es", label: "やる →", external: false };
  if (/面接|インタビュー|面談/.test(a))
    return { href: "/interviews", label: "やる →", external: false };
  if (/OB|OG|訪問|OBOG/.test(a))
    return { href: "/ob-visits", label: "やる →", external: false };
  if (/筆記試験|SPI|テスト|適性/.test(a))
    return { href: "/tests", label: "記録 →", external: false };
  if (/企業|応募|リサーチ|調べ|受験/.test(a))
    return { href: "/companies", label: "やる →", external: false };
  if (/自己分析|ガクチカ|自己PR|強み|弱み|就活の軸/.test(a))
    return { href: "/career", label: "やる →", external: false };
  if (/コーチ|チャット|相談|カレオ|話/.test(a))
    return { href: "/chat", label: "やる →", external: false };
  if (/PDCA|振り返り|レポート/.test(a))
    return { href: "/report", label: "やる →", external: false };
  if (/締切|スケジュール|カレンダー/.test(a))
    return { href: "/calendar", label: "やる →", external: false };
  if (/プロフィール|設定/.test(a))
    return { href: "/settings", label: "やる →", external: false };
  return undefined;
}

function rowToItem(row: Record<string, unknown>): ActionItem {
  const action = row.action as string;
  return {
    id: row.id as string,
    action,
    reason: (row.reason as string) ?? "",
    priority: row.priority as "high" | "medium" | "low",
    isCompleted: row.is_completed as boolean,
    link: inferActionLink(action),
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
