"use client";

import { useEffect } from "react";

/**
 * PWAのためのService Worker登録。
 * 全ユーザーで登録することでインストールプロンプトが出やすくなり、
 * オフラインフォールバックも有効になる。
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // 開発モードでは登録しない（HMRと衝突するため）
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        // エラーはコンソールに出すだけ、アプリ動作には影響させない
        console.warn("[sw] register failed:", err);
      });
  }, []);

  return null;
}
