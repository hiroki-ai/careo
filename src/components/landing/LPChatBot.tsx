"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE =
  "やあ！カレオだよ👋\nCareoのこと、就活のこと、なんでも聞いてね！";

const SUGGESTIONS = [
  "Careoってどんなアプリ？",
  "ChatGPTと何が違うの？",
  "就活のコツを教えて！",
  "Careoの今後の展望は？",
];

export function LPChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // チャットを開いたとき初回ウェルカムメッセージを表示
  useEffect(() => {
    if (open && !hasGreeted) {
      setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
      setHasGreeted(true);
    }
  }, [open, hasGreeted]);

  // 新メッセージが来たらスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // チャットが開いたらinputにフォーカス
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/lp-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "エラーが発生したよ。もう一度試してね！" }));
        setMessages([...nextMessages, { role: "assistant", content: err.error ?? "エラーが発生したよ。" }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages([...nextMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { role: "assistant", content: assistantText }]);
      }
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "エラーが発生したよ。もう一度試してね！" }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <>
      {/* チャットウィンドウ */}
      {open && (
        <div
          className="fixed bottom-24 left-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          style={{ height: "460px", background: "#fff" }}
        >
          {/* ヘッダー */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100"
            style={{ background: "linear-gradient(135deg, #00c896 0%, #00a87e 100%)" }}>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <img src="/icon-new.svg" alt="カレオ" className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none">カレオ</p>
              <p className="text-white/80 text-[10px] mt-0.5">Careoの就活AIコーチ</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
              aria-label="閉じる"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* メッセージ一覧 */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 text-sm"
            style={{ background: "#f8fafb" }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "linear-gradient(135deg, #00c896 0%, #00a87e 100%)" }}>
                    <img src="/icon-new.svg" alt="K" className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3 py-2 max-w-[78%] leading-relaxed whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "text-white text-xs font-medium rounded-br-sm"
                      : "bg-white text-[#0D0B21] text-xs shadow-sm border border-gray-100 rounded-bl-sm"
                  }`}
                  style={m.role === "user" ? { background: "linear-gradient(135deg, #00c896 0%, #00a87e 100%)" } : {}}
                >
                  {m.content || (
                    <span className="flex gap-1 items-center py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* サジェスションボタン */}
            {showSuggestions && (
              <div className="flex flex-col gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-xs px-3 py-2 rounded-xl border border-[#00c896]/30 bg-white text-[#00a87e] font-medium hover:bg-[#00c896]/8 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* 入力エリア */}
          <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="カレオに質問する…"
              disabled={loading}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-[#00c896] bg-gray-50 placeholder-gray-400 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #00c896 0%, #00a87e 100%)" }}
              aria-label="送信"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* マスコットボタン（左下固定） */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 left-4 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: open
            ? "linear-gradient(135deg, #00a87e 0%, #008f6a 100%)"
            : "linear-gradient(135deg, #00c896 0%, #00a87e 100%)",
          boxShadow: "0 4px 20px rgba(0, 200, 150, 0.4)",
        }}
        aria-label={open ? "チャットを閉じる" : "カレオに質問する"}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <img src="/icon-new.svg" alt="カレオ" className="w-8 h-8" />
        )}

        {/* 未読バッジ（初回表示） */}
        {!hasGreeted && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">1</span>
          </span>
        )}
      </button>

      {/* ふきだしヒント（初回・チャット未開封時） */}
      {!open && !hasGreeted && (
        <div
          className="fixed bottom-24 left-4 z-50 bg-white rounded-2xl px-3 py-2 shadow-lg border border-gray-100 text-xs text-[#0D0B21] font-medium pointer-events-none"
          style={{ maxWidth: "180px" }}
        >
          <span className="text-[#00a87e]">カレオ</span>に何でも聞いてね👋
          {/* 吹き出し尾 */}
          <span
            className="absolute left-4 -bottom-2 w-3 h-3 bg-white border-r border-b border-gray-100"
            style={{ transform: "rotate(45deg)", bottom: "-6px" }}
          />
        </div>
      )}
    </>
  );
}
