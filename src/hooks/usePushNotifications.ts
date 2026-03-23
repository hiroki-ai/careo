"use client";

import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // 現在の購読状態を確認
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsSubscribed(!!sub);
      });
    });
  }, []);

  // Service Worker を登録
  const registerSW = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      return reg;
    } catch (err) {
      console.error("[SW register]", err);
      return null;
    }
  }, []);

  // 通知を購読
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!VAPID_PUBLIC_KEY) {
      console.warn("[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY が未設定です");
      return false;
    }
    setLoading(true);
    try {
      const reg = await registerSW();
      if (!reg) return false;

      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });

      const ok = res.ok;
      setIsSubscribed(ok);
      return ok;
    } catch (err) {
      console.error("[Push subscribe]", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [registerSW]);

  // 購読解除
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) return true;
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error("[Push unsubscribe]", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const isSupported = typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

  return { permission, isSubscribed, isSupported, loading, subscribe, unsubscribe };
}
