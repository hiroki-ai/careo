"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useChat } from "@/hooks/useChat";
import { useProfile } from "@/hooks/useProfile";
import { useCompanies } from "@/hooks/useCompanies";

// カレオのキャラクターSVG
export function KareoCharacter({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="kareoHead" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      {/* アンテナ */}
      <line x1="32" y1="6" x2="32" y2="13" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="32" cy="4" r="3" fill="#A5B4FC" />
      {/* 頭 */}
      <rect x="6" y="12" width="52" height="46" rx="16" fill="url(#kareoHead)" />
      {/* 耳（左） */}
      <rect x="2" y="24" width="6" height="12" rx="3" fill="#4338CA" />
      {/* 耳（右） */}
      <rect x="56" y="24" width="6" height="12" rx="3" fill="#4338CA" />
      {/* 目（白目） */}
      <circle cx="23" cy="32" r="7" fill="white" />
      <circle cx="41" cy="32" r="7" fill="white" />
      {/* 目（瞳） */}
      <circle cx="24" cy="33" r="4" fill="#1E1B4B" />
      <circle cx="42" cy="33" r="4" fill="#1E1B4B" />
      {/* 目のハイライト */}
      <circle cx="26" cy="31" r="1.5" fill="white" />
      <circle cx="44" cy="31" r="1.5" fill="white" />
      {/* 頬 */}
      <circle cx="14" cy="40" r="5" fill="#C7D2FE" opacity="0.45" />
      <circle cx="50" cy="40" r="5" fill="#C7D2FE" opacity="0.45" />
      {/* 口 */}
      <path d="M24 44 Q32 51 40 44" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

interface StreamingMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const GREETING = "やあ！何か相談ある？";

export function KareoWidget() {
  const { messages: savedMessages, loading: historyLoading, saveMessage } = useChat();
  const { profile } = useProfile();
  const { companies } = useCompanies();
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 直近3件を表示
  const recentHistory = savedMessages.slice(-6);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInput("");
    setIsStreaming(true);

    const userMsg: StreamingMessage = { role: "user", content: text };
    setLocalMessages((prev) => [...prev, userMsg]);
    await saveMessage("user", text);
    setLocalMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const historyForApi = [
        ...savedMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ];

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForApi,
          context: {
            profile: profile ? {
              university: profile.university,
              faculty: profile.faculty,
              grade: profile.grade,
              targetIndustries: profile.targetIndustries,
              targetJobs: profile.targetJobs,
              jobSearchStage: profile.jobSearchStage,
              careerAxis: profile.careerAxis,
              gakuchika: profile.gakuchika,
            } : undefined,
            companiesCount: companies.length,
            offeredCount: companies.filter((c) => c.status === "OFFERED").length,
          },
        }),
      });

      if (!res.body) throw new Error();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setLocalMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: accumulated, streaming: true },
        ]);
      }

      if (accumulated) {
        await saveMessage("assistant", accumulated);
        setLocalMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: accumulated },
        ]);
      }
    } catch {
      setLocalMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };

  // ウィジェットに表示するメッセージ（履歴 or ローカル）
  const displayMessages: StreamingMessage[] = localMessages.length > 0
    ? localMessages
    : recentHistory.map((m) => ({ role: m.role, content: m.content }));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* カレオヘッダー */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 flex items-center gap-3">
        <KareoCharacter size={40} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">カレオ</p>
          <p className="text-indigo-200 text-[10px]">就活AIアシスタント</p>
        </div>
        <Link
          href="/chat"
          className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-full transition-colors shrink-0"
        >
          全画面で話す →
        </Link>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {historyLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-gray-300">読み込み中...</p>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
            <KareoCharacter size={48} />
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[90%]">
              <p className="text-xs text-gray-700 dark:text-gray-300">{GREETING}</p>
            </div>
            {/* クイックサジェスト */}
            <div className="w-full space-y-1.5 mt-1">
              {["面接対策を手伝って", "ガクチカ聞いて", "今の状況どう思う？"].map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left text-xs bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-gray-100 dark:border-gray-600 hover:border-indigo-200 dark:hover:border-indigo-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {displayMessages.slice(-6).map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-[9px] font-bold">K</span>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                  {msg.streaming && msg.content === "" && (
                    <span className="inline-flex gap-0.5 ml-1">
                      {[0,1,2].map((j) => (
                        <span key={j} className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${j * 0.15}s` }} />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 入力 */}
      <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-1.5 focus-within:border-indigo-300 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(input); }}
            placeholder="カレオに聞いてみよう..."
            className="flex-1 bg-transparent text-xs outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
            disabled={isStreaming || historyLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0 hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
