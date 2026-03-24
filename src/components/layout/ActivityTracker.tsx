"use client";

import { useEffect } from "react";

// セッション開始時に last_active_at を更新する軽量クライアントコンポーネント
export function ActivityTracker() {
  useEffect(() => {
    fetch("/api/account/activity", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
