"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const LS_DONE = "careo_review_done";
const LS_LAST_SHOWN = "careo_review_last_shown";
const DAYS_AFTER_SIGNUP = 7;
const DAYS_BEFORE_RESHOWN = 30;

export function ReviewPromptModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"prompt" | "form" | "done">("prompt");
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [university, setUniversity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (localStorage.getItem(LS_DONE)) return;

        const lastShown = localStorage.getItem(LS_LAST_SHOWN);
        if (lastShown) {
          const diffDays = (Date.now() - new Date(lastShown).getTime()) / 86400000;
          if (diffDays < DAYS_BEFORE_RESHOWN) return;
        }

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const daysSinceSignup = (Date.now() - new Date(user.created_at).getTime()) / 86400000;
        if (daysSinceSignup < DAYS_AFTER_SIGNUP) return;

        // 5秒後に表示
        setTimeout(() => setVisible(true), 5000);
      } catch {
        // 表示しない
      }
    })();
  }, []);

  function dismiss() {
    localStorage.setItem(LS_LAST_SHOWN, new Date().toISOString());
    setVisible(false);
  }

  function dismissForever() {
    localStorage.setItem(LS_DONE, "1");
    setVisible(false);
  }

  async function submit() {
    if (!quote.trim() || !displayName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, quote, display_name: displayName, university }),
      });
      if (res.ok || res.status === 409) {
        localStorage.setItem(LS_DONE, "1");
        setStep("done");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>

        {step === "prompt" && (
          <>
            <p className="text-lg font-bold text-[#0D0B21] mb-1">Careoを使ってみて、どうですか？</p>
            <p className="text-sm text-gray-500 mb-5">あなたの声がサービス改善と、これから就活を始める後輩の参考になります。</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setStep("form")}
                className="w-full py-2.5 bg-[#00c896] text-white rounded-xl font-semibold text-sm hover:bg-[#00b085] transition-colors"
              >
                感想を書く（1分くらい）
              </button>
              <button
                onClick={dismiss}
                className="w-full py-2 text-gray-400 text-sm hover:text-gray-600"
              >
                あとで
              </button>
              <button
                onClick={dismissForever}
                className="w-full py-1 text-gray-300 text-xs hover:text-gray-400"
              >
                表示しない
              </button>
            </div>
          </>
        )}

        {step === "form" && (
          <>
            <p className="text-base font-bold text-[#0D0B21] mb-4">感想を聞かせてください</p>

            {/* 星評価 */}
            <div className="flex gap-1 mb-4 justify-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <svg className={`w-8 h-8 ${s <= rating ? "text-amber-400" : "text-gray-200"} transition-colors`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>

            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="使ってみた感想を自由に（10〜300文字）"
              rows={3}
              maxLength={300}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-[#00c896]/30"
            />

            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名（例：M.T.、匿名）"
              maxLength={20}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 mb-2 focus:outline-none focus:ring-2 focus:ring-[#00c896]/30"
            />
            <input
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="大学・学年（任意）例：早稲田大学 · 就活生"
              maxLength={40}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-[#00c896]/30"
            />
            <p className="text-xs text-gray-400 mb-4">※ 運営が確認後、LPに掲載する場合があります</p>

            <button
              onClick={submit}
              disabled={submitting || quote.trim().length < 10 || !displayName.trim()}
              className="w-full py-2.5 bg-[#00c896] text-white rounded-xl font-semibold text-sm hover:bg-[#00b085] transition-colors disabled:opacity-40"
            >
              {submitting ? "送信中…" : "送信する"}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <p className="text-2xl mb-3">🙏</p>
            <p className="font-bold text-[#0D0B21] mb-1">ありがとうございます！</p>
            <p className="text-sm text-gray-500 mb-5">あなたの声がCareoをより良くします。</p>
            <button
              onClick={() => { setVisible(false); }}
              className="px-6 py-2 bg-[#00c896] text-white rounded-xl font-semibold text-sm"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
