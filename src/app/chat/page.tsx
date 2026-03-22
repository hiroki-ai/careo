"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useActionItems } from "@/hooks/useActionItems";
import { useObVisits } from "@/hooks/useObVisits";
import { useAptitudeTests } from "@/hooks/useAptitudeTests";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/components/ui/Toast";
import { parseCompanySuggestions, parseSelfAnalysis, SELF_ANALYSIS_LABELS, SelfAnalysisSuggestion } from "@/lib/chatUtils";

interface CalendarEvent {
  type: "interview" | "deadline" | "other";
  title: string;
  date: string;
  companyName?: string;
}

interface LocalMessage {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  suggestedCompanies?: string[];
  selfAnalysisSuggestions?: SelfAnalysisSuggestion[];
  savedFields?: string[]; // 保存済みフィールドを追跡
  calendarEvents?: CalendarEvent[];
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
  "今の状況を整理してアドバイスして",
  "志望動機の作り方を教えて",
  "グループディスカッションのコツを知りたい",
];

export default function ChatPage() {
  const { profile, patchSelfAnalysis } = useProfile();
  const { companies, addCompany } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { pendingItems, completedItems, addItems } = useActionItems();
  const { visits } = useObVisits();
  const { tests } = useAptitudeTests();
  const { messages: savedMessages, loading: historyLoading, saveMessage, clearHistory } = useChat();
  const { showToast } = useToast();
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // 保存済み履歴を読み込む（初回のみ）
  useEffect(() => {
    if (!historyLoading && !initialized) {
      if (savedMessages.length > 0) {
        setLocalMessages(savedMessages.map((m) => ({ role: m.role, content: m.content })));
      } else {
        // 新規チャット：PDCAがあればそれに言及したウェルカムメッセージ
        const pdca = getLastPdca();
        const welcomeContent = pdca?.check
          ? `やあ！カレオだよ👋\n前回のPDCA分析を見たんだけど、スコアが${pdca.check.score}点だったね。${pdca.act?.nextWeekFocus ? `「${pdca.act.nextWeekFocus}」が今週の最重要テーマだよ。` : ""}一緒に課題を解決していこう！\n\n何か相談したいことある？`
          : WELCOME_MESSAGE.content;
        setLocalMessages([{ role: "assistant", content: welcomeContent }]);
      }
      setInitialized(true);
    }
  }, [historyLoading, savedMessages, initialized]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // 音声出力
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\[追加候補:.*?\]/g, "")
      .replace(/[*_`#]/g, "")
      .replace(/\n+/g, "。")
      .slice(0, 250);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "ja-JP";
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // 音声入力の開始/停止
  const toggleRecording = useCallback(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      showToast("音声入力はこのブラウザでは使えません", "warning");
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SR();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.start();
  }, [isRecording, showToast]);

  // 直近のPDCA結果をlocalStorageから読む
  const getLastPdca = () => {
    try {
      const raw = localStorage.getItem("careo_last_pdca");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const buildContext = () => ({
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
      strengths: profile.strengths,
      weaknesses: profile.weaknesses,
    } : undefined,
    companies: companies.map(c => ({ name: c.name, status: c.status, industry: c.industry, is_intern_offer: c.is_intern_offer })),
    esList: esList.map(e => ({
      title: e.title,
      status: e.status,
      companyName: companies.find(c => c.id === e.companyId)?.name ?? "不明",
      questions: e.questions.map(q => ({ question: q.question, answer: q.answer })),
    })),
    interviews: interviews.map(i => ({
      round: i.round,
      result: i.result,
      companyName: companies.find(c => c.id === i.companyId)?.name ?? "不明",
      notes: i.notes,
    })),
    obVisits: visits.map(v => ({
      companyName: v.companyName,
      purpose: v.purpose,
      impression: v.impression,
      insights: v.insights,
    })),
    aptitudeTests: tests.map(t => ({
      companyName: t.companyName,
      testType: t.testType,
      result: t.result,
      scoreVerbal: t.scoreVerbal,
      scoreNonverbal: t.scoreNonverbal,
    })),
    pendingActions: pendingItems.map(i => i.action),
    completedActions: completedItems.slice(0, 5).map(i => i.action),
    lastPdca: getLastPdca(),
  });

  // チャット終了後にバックグラウンドで情報を抽出・自動保存
  const runChatSync = useCallback(async (recentMessages: LocalMessage[]) => {
    try {
      const payload = {
        recentMessages: recentMessages
          .filter(m => !m.streaming)
          .slice(-6)
          .map(m => ({ role: m.role, content: m.content })),
        existingCompanies: companies.map(c => c.name),
        existingSelfAnalysis: {
          careerAxis: profile?.careerAxis ?? "",
          gakuchika: profile?.gakuchika ?? "",
          selfPr: profile?.selfPr ?? "",
          strengths: profile?.strengths ?? "",
          weaknesses: profile?.weaknesses ?? "",
        },
        pendingActions: pendingItems.map(i => i.action),
      };

      const res = await fetch("/api/ai/chat-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;

      const result = await res.json() as {
        selfAnalysis: Record<string, string>;
        newCompanies: string[];
        actionItems: { action: string; reason: string; priority: "high" | "medium" | "low" }[];
        calendarEvents: CalendarEvent[];
        shouldRefreshPdca: boolean;
      };

      // 自己分析フィールドの自動保存
      const saFields = Object.entries(result.selfAnalysis).filter(([, v]) => v && String(v).trim());
      if (saFields.length > 0) {
        const patch = Object.fromEntries(saFields.map(([k, v]) => [k, String(v).trim()]));
        const ok = await patchSelfAnalysis(patch as Parameters<typeof patchSelfAnalysis>[0]);
        if (ok) {
          const labels: Record<string, string> = {
            careerAxis: "就活の軸", gakuchika: "ガクチカ", selfPr: "自己PR",
            strengths: "強み", weaknesses: "弱み",
          };
          const fieldNames = saFields.map(([k]) => labels[k] ?? k).join("・");
          showToast(`${fieldNames}を自己分析に自動保存しました`, "success");
        }
      }

      // 新規企業の自動追加
      for (const name of result.newCompanies) {
        const exists = companies.find(c => c.name === name);
        if (!exists) {
          await addCompany({ name, status: "WISHLIST", industry: "", notes: "カレオとのチャットから自動追加" });
          showToast(`「${name}」を企業管理に追加しました`, "success");
        }
      }

      // アクションアイテムの自動追加
      if (result.actionItems.length > 0) {
        await addItems(result.actionItems);
        if (result.actionItems.length > 0) {
          showToast(`${result.actionItems.length}件のアクションをダッシュボードに追加しました`, "info");
        }
      }

      // カレンダーイベントを最後のメッセージに付与
      if (result.calendarEvents && result.calendarEvents.length > 0) {
        setLocalMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== "assistant") return prev;
          return [...prev.slice(0, -1), { ...last, calendarEvents: result.calendarEvents }];
        });
      }

      // PDCA更新が必要な場合はlocalStorageのキャッシュを削除して次回再取得を促す
      if (result.shouldRefreshPdca) {
        try { localStorage.removeItem("careo_last_pdca"); } catch { /* ignore */ }
      }
    } catch (err) {
      console.error("[chat-sync]", err);
    }
  }, [companies, profile, pendingItems, patchSelfAnalysis, addCompany, addItems, showToast]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInput("");
    setIsStreaming(true);

    const userMsg: LocalMessage = { role: "user", content: text };
    setLocalMessages((prev) => [...prev, userMsg]);
    await saveMessage("user", text);
    // 今日チャットしたことを記録（バッジ消去）
    try { localStorage.setItem("careo_last_chat_date", new Date().toDateString()); } catch { /* ignore */ }
    setLocalMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const historyForApi = localMessages
        .filter((m) => !m.streaming)
        .concat(userMsg)
        .filter((m) => !(m.role === "assistant" && m.content === WELCOME_MESSAGE.content))
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi, context: buildContext() }),
      });

      // レート制限 or コンテンツモデレーション
      if (res.status === 429 || res.status === 400) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        const limitMsg = errData.error ?? "しばらく時間をおいてから再試行してね😢";
        await saveMessage("assistant", limitMsg);
        setLocalMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: limitMsg },
        ]);
        setIsStreaming(false);
        return;
      }

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

      if (accumulated) {
        await saveMessage("assistant", accumulated);
        const { display: d1, companies: suggested } = parseCompanySuggestions(accumulated);
        const { display, suggestions: selfSuggestions } = parseSelfAnalysis(d1);
        const finalMessages: LocalMessage[] = [
          ...localMessages.filter(m => !m.streaming).concat(userMsg),
          {
            role: "assistant",
            content: display,
            suggestedCompanies: suggested.length ? suggested : undefined,
            selfAnalysisSuggestions: selfSuggestions.length ? selfSuggestions : undefined,
          },
        ];
        setLocalMessages(finalMessages);
        speak(display);
        // バックグラウンドで情報を抽出・各機能へ自動同期（エラーは無視）
        runChatSync(finalMessages).catch(() => {});
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

  const handleSaveSelfAnalysis = async (msgIndex: number, suggestion: SelfAnalysisSuggestion) => {
    const ok = await patchSelfAnalysis({ [suggestion.field]: suggestion.content });
    if (ok) {
      showToast(`${SELF_ANALYSIS_LABELS[suggestion.field]}を自己分析に保存しました`, "success");
      // 保存済みフィールドをメッセージに記録してボタンを変化させる
      setLocalMessages((prev) => prev.map((m, i) =>
        i === msgIndex
          ? { ...m, savedFields: [...(m.savedFields ?? []), suggestion.field] }
          : m
      ));
    } else {
      showToast("保存に失敗しました", "error");
    }
  };

  const handleAddCompany = async (name: string) => {
    const already = companies.find(c => c.name === name);
    if (already) {
      showToast(`「${name}」はすでに登録されています`, "info");
      return;
    }
    await addCompany({ name, status: "WISHLIST", industry: "", notes: "カレオとのチャットから追加" });
    showToast(`「${name}」を企業管理に追加しました`, "success");
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

  // カレオが知っているデータ数
  const dataCount = companies.length + esList.length + interviews.length + visits.length + tests.length;
  const showSuggestions = localMessages.length <= 1 && !isStreaming;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-gray-100 bg-white shrink-0">
        <KAREO_AVATAR />
        <div className="min-w-0">
          <h1 className="font-semibold text-gray-900">カレオコーチ</h1>
          <p className="text-xs text-gray-400 truncate">
            {dataCount > 0 ? `${dataCount}件のデータを把握中 · ` : ""}相談内容はAI分析に反映されます
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {/* 音声出力トグル */}
          <button
            onClick={() => {
              const next = !voiceEnabled;
              setVoiceEnabled(next);
              if (!next && typeof window !== "undefined") window.speechSynthesis?.cancel();
            }}
            title={voiceEnabled ? "音声読み上げオン" : "音声読み上げオフ"}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${voiceEnabled ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            {voiceEnabled ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            )}
          </button>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            オンライン
          </span>
          {savedMessages.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors hidden sm:block"
            >
              履歴削除
            </button>
          )}
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 bg-gray-50">
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-xs text-gray-400">履歴を読み込み中...</div>
          </div>
        ) : (
          <>
            {localMessages.map((msg, i) => (
              <div key={i}>
                <div className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {msg.role === "assistant" && <KAREO_AVATAR />}
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <span className="text-gray-600 text-sm">👤</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"
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
                    {/* カレオメッセージの音声再生ボタン */}
                    {msg.role === "assistant" && !msg.streaming && msg.content && (
                      <button
                        onClick={() => speak(msg.content)}
                        className="self-start ml-1 text-gray-300 hover:text-blue-400 transition-colors"
                        title="読み上げる"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {/* 自己分析保存ボタン */}
                {msg.selfAnalysisSuggestions && msg.selfAnalysisSuggestions.length > 0 && (
                  <div className="ml-11 mt-2 space-y-2">
                    {msg.selfAnalysisSuggestions.map((s) => {
                      const saved = msg.savedFields?.includes(s.field);
                      return (
                        <div key={s.field} className={`rounded-xl border p-3 ${saved ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${saved ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                              📝 {SELF_ANALYSIS_LABELS[s.field]}
                            </span>
                            <button
                              onClick={() => handleSaveSelfAnalysis(i, s)}
                              disabled={saved}
                              className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors shrink-0 ${
                                saved
                                  ? "bg-green-200 text-green-700 cursor-default"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              {saved ? "✓ 保存済み" : "自己分析に保存"}
                            </button>
                          </div>
                          <p className="text-xs text-gray-700 line-clamp-3">{s.content}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 企業追加候補ボタン */}
                {msg.suggestedCompanies && msg.suggestedCompanies.length > 0 && (
                  <div className="ml-11 mt-2 flex flex-wrap gap-2">
                    {msg.suggestedCompanies.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleAddCompany(name)}
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-full px-3 py-1.5 transition-colors flex items-center gap-1.5 font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {name}を企業管理に追加
                      </button>
                    ))}
                  </div>
                )}

                {/* カレンダーイベントカード */}
                {msg.calendarEvents && msg.calendarEvents.length > 0 && (
                  <div className="ml-11 mt-2 space-y-2">
                    {msg.calendarEvents.map((event, j) => {
                      const dateLabel = (() => {
                        try {
                          const d = new Date(event.date);
                          return `${d.getMonth() + 1}/${d.getDate()}（${["日","月","火","水","木","金","土"][d.getDay()]}）`;
                        } catch { return event.date; }
                      })();
                      const href = event.type === "interview" ? "/interviews" : event.type === "deadline" ? "/es" : "/deadlines";
                      const linkLabel = event.type === "interview" ? "面接ログに追加" : event.type === "deadline" ? "ES締切に設定" : "カレンダーで確認";
                      return (
                        <div key={j} className="rounded-xl border border-orange-200 bg-orange-50 p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-orange-800">📅 {event.title}</p>
                            <p className="text-[11px] text-orange-600 mt-0.5">
                              {event.companyName ? `${event.companyName} · ` : ""}{dateLabel}
                            </p>
                          </div>
                          <a
                            href={href}
                            className="shrink-0 text-xs bg-orange-500 hover:bg-orange-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {linkLabel}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                      className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
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
      <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
        <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200 transition-all">
          {/* 音声入力ボタン */}
          <button
            onClick={toggleRecording}
            title={isRecording ? "録音を停止" : "音声で入力"}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-colors ${
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93H2c0 4.72 3.44 8.65 8 9.58V21h4v-3.49c4.56-.93 8-4.86 8-9.51h-2c0 4.07-3.06 7.43-7 7.93z" />
            </svg>
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "音声を認識中..." : "メッセージを入力... (Shift+Enterで改行)"}
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none text-gray-800 placeholder-gray-400 max-h-32"
            style={{ minHeight: "24px" }}
            disabled={isStreaming || historyLoading}
          />
          <button
            type="button"
            title="送信"
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
