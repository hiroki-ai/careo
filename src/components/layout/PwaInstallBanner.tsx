"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // すでに閉じた / すでにインストール済みなら表示しない
    if (localStorage.getItem("careo_pwa_dismissed")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("careo_pwa_dismissed", "1");
    }
    setVisible(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("careo_pwa_dismissed", "1");
  };

  if (!visible || !prompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] md:hidden">
      <div className="bg-gradient-to-r from-[#00c896] to-[#00a87e] px-4 py-2.5 flex items-center gap-3 shadow-lg">
        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm">
          C
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">ホーム画面に追加</p>
          <p className="text-white/80 text-xs">オフラインでも使えます</p>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 text-xs bg-white text-[#00c896] font-bold px-3 py-1.5 rounded-lg"
        >
          追加
        </button>
        <button
          type="button"
          title="閉じる"
          onClick={handleDismiss}
          className="shrink-0 text-white/70 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
