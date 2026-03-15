"use client";

import { useEffect, useRef } from "react";
import { daysUntil } from "@/lib/utils";

interface DeadlineItem {
  id: string;
  title: string;
  date: string;
  type: string;
}

const STORAGE_KEY = "careo_notified_deadlines";

function getNotifiedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function markNotified(key: string) {
  const set = getNotifiedSet();
  set.add(key);
  // 古いエントリは100件超えたら削除
  const arr = Array.from(set);
  if (arr.length > 100) arr.splice(0, arr.length - 100);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

export function useDeadlineNotifications(items: DeadlineItem[]) {
  const permissionRef = useRef<NotificationPermission>("default");

  useEffect(() => {
    if (!("Notification" in window)) return;
    permissionRef.current = Notification.permission;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        permissionRef.current = p;
      });
    }
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (permissionRef.current !== "granted" && Notification.permission !== "granted") return;
    if (items.length === 0) return;

    const notified = getNotifiedSet();

    for (const item of items) {
      const days = daysUntil(item.date);
      if (days < 0 || days > 3) continue;

      const notifyKey = `${item.id}-${days}d`;
      if (notified.has(notifyKey)) continue;

      const label = days === 0 ? "今日が締切" : `あと${days}日`;
      const body = `${item.type}: ${item.title}（${label}）`;

      try {
        new Notification("⚠️ Careo 締切リマインダー", { body, icon: "/favicon.ico" });
        markNotified(notifyKey);
      } catch {}
    }
  }, [items]);
}
