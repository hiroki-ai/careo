"use client";

import { useState, useRef, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompanies } from "@/hooks/useCompanies";
import { useChat } from "@/hooks/useChat";

interface LocalMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const KAREO_AVATAR = () => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
    <span className="text-white text-sm font-bold">K</span>
  </div>
);

const WELCOME_MESSAGE: LocalMessage = {
  role: "assistant",
  content: "やあ！カレオだよ👋 就活のことなら何でも相談してね。\nES・面接対策・自己分析・業界研究・悩み相談、なんでもOK！",
};

const SUGGESTIONS = [
  "自己PRを一緒に考えてほしい",
  "面接でよく聞かれることを教えて",
  "ガクチカのブラッシュアップをお願い",
  "就活のスケジュールを確認したい",
  "志望動機の作り方を教えて",
  "グループディスカッションのコツを知りたい",
];

export default function ChatPage() {
  const { profile } = useProfile();
  const { companies } = useCompanies();
  const { messages: savedMessages, loading: historyLoading, saveMessage, clearHistory } = useChat();
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 保存済み履歴を読み込む（初回のみ）
  useEffect(() => {
    if (!historyLoading && !initialized) {
      if (savedMessages.length > 0) {
        setLocalMessages(savedMessages.map((m) => ({ role: m.role, content: m.content })));
      } else {
        setLocalMessages([WELCOME_MESSAGE]);
      }
      setInitialized(true);
    }
  }, [historyLoading, savedMessages, initialized]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInput("");
    setIsStreaming(true);

    const userMsg: LocalMessage = { role: "user", content: text };
    setLocalMessages((prev) => [...prev, userMsg]);

    // ユーザーメッセージをDBに保存
    await saveMessage("user", text);

    // ストリーミング用の空メッセージを追加
    setLocalMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const context = {
        profile: profile ? {
          university: profile.university,
          faculty: profile.faculty,
          grade: profile.grade,
          graduationYear: profile.graduationYear,
          targetIndustries: profile.targetIndustries,
          targetJobs: profile.targetJobs,
          jobSearchStage: profile.jobSearchStage,
          careerAxis: profile.careerAxis,
          gakuchika: profile.gakuchika,
          selfPr: profile.selfPr,
        } : undefined,
        companiesCount: companies.length,
        offeredCount: companies.filter((c) => c.status === "OFFERED").length,
        pendingInterviews: companies.filter((c) =>
          ["INTERVIEW_1", "INTERVIEW_2", "FINAL"].includes(c.status)
        ).length,
      };

      // 送信するメッセージ履歴（ウェルカム除く、直近20件）
      const historyForApi = localMessages
        .filter((m) => !m.streaming)
        .concat(userMsg)
        .filter((m) => !(m.role === "assistant" && m.content === WELCOME_MESSAGE.content))
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi, context }),
      });

      if (!res.ok || !res.body) throw new Error("Stream error");

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

      // ストリーミング完了 → DBに保存
      if (accumulated) {
        await saveMessage("assistant", accumulated);
        setLocalMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: accumulated },
        ]);
      }
    } catch (err) {
      console.error("[chat]", err);
      const errMsg = "ごめん、エラーが起きちゃった。もう一度試してみて！";
      await saveMessage("assistant", errMsg);
      setLocalMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: errMsg },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleClear = async () => {
    if (!confirm("チャット履歴を全て削除しますか？")) return;
    await clearHistory();
    setLocalMessages([WELCOME_MESSAGE]);
    setInitialized(false);
    setTimeout(() => setInitialized(true), 0);
  };

  const showSuggestions = localMessages.length <= 1 && !isStreaming;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <KAREO_AVATAR />
        <div>
          <h1 className="font-semibold text-gray-900 dark:text-gray-100">カレオ</h1>
          <p className="text-xs text-gray-400">就活AIアシスタント · 相談内容はAI分析に反映されます</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {savedMessages.length > 0 && (
            <span className="text-xs text-gray-400">{savedMessages.length}件の履歴</span>
          )}
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            オンライン
          </span>
          <button
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            履歴削除
          </button>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-xs text-gray-400">履歴を読み込み中...</div>
          </div>
        ) : (
          <>
            {localMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "assistant" && <KAREO_AVATAR />}
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
                    <span className="text-gray-600 dark:text-gray-300 text-sm">👤</span>
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-100 dark:border-gray-700"
                  }`}
                >
                  {msg.content}
                  {msg.streaming && msg.content === "" && (
                    <span className="inline-flex gap-1 ml-1">
                      {[...Array(3)].map((_, j) => (
                        <span
                          key={j}
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${j * 0.15}s` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="ml-11">
                <p className="text-xs text-gray-400 mb-2">こんなことを聞いてみよう</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力... (Shift+Enterで改行)"
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400 max-h-32"
            style={{ minHeight: "24px" }}
            disabled={isStreaming || historyLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming || historyLoading}
            className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-1.5">
          相談内容はあなた専用のAI分析に活かされます
        </p>
      </div>
    </div>
  );
}
