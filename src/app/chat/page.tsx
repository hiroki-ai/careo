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
import { COACH_PERSONALITIES, getCoachPersonality, getRandomThinkingMessage, DEFAULT_COACH_ID } from "@/lib/coachPersonalities";
import { KareoAvatar } from "@/components/kareo/KareoAvatar";

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
  isWelcome?: boolean;
  suggestedCompanies?: string[];
  selfAnalysisSuggestions?: SelfAnalysisSuggestion[];
  savedFields?: string[]; // 保存済みフィールドを追跡
  calendarEvents?: CalendarEvent[];
  createdAt?: string;
}

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getDateLabel = (dateStr?: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, today)) return "今日";
  if (isSameDay(date, yesterday)) return "昨日";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatTime = (dateStr?: string): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("ja-JP", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
};

const CoachAvatar = ({ coachId, size = 8 }: { coachId: string; size?: number }) => {
  const coach = getCoachPersonality(coachId);
  const pxSize = size * 4; // Tailwind units to px (w-8 = 32px)
  if (coachId === "kareo") {
    return <KareoAvatar size={pxSize} className="shadow-sm" />;
  }
  const sizeClass = `w-${size} h-${size}`;
  if (coach.avatarSvg) {
    return (
      <div
        className={`${sizeClass} rounded-full shrink-0 shadow-sm overflow-hidden`}
        dangerouslySetInnerHTML={{ __html: coach.avatarSvg }}
      />
    );
  }
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br ${coach.avatarGradient} flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="text-white text-sm font-bold">{coach.avatarLabel}</span>
    </div>
  );
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
  const { profile, saveProfile: _saveProfile, patchSelfAnalysis, patchProfileBasics, saveAiSelfAnalysis, saveCoachId, saveLastChatAt } = useProfile();
  const { companies, addCompany, updateCompany } = useCompanies();
  const { esList } = useEs();
  const { interviews, addInterview } = useInterviews();
  const { pendingItems, completedItems, addItems } = useActionItems();
  const { visits } = useObVisits();
  const { tests } = useAptitudeTests();
  const { messages: savedMessages, loading: historyLoading, saveMessage, clearHistory } = useChat();
  const { showToast } = useToast();
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const thinkingMessageRef = useRef<string>("");
  const [initialized, setInitialized] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [coachId, setCoachId] = useState<string>(DEFAULT_COACH_ID);
  const [showCoachSelector, setShowCoachSelector] = useState(false);
  const [fileAttachment, setFileAttachment] = useState<{ name: string; type: string; data: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // iOS キーボード表示時にコンテナ高さを動的調整
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      if (containerRef.current) {
        containerRef.current.style.height = `${vv.height}px`;
      }
    };
    vv.addEventListener("resize", handler);
    vv.addEventListener("scroll", handler);
    handler();
    return () => {
      vv.removeEventListener("resize", handler);
      vv.removeEventListener("scroll", handler);
    };
  }, []);

  // コーチIDを初期化（Supabase優先、フォールバックはlocalStorage）
  useEffect(() => {
    if (profile?.coachId) {
      // Supabase値を正とする（デバイス間同期）
      setCoachId(profile.coachId);
      localStorage.setItem("careo_coach_id", profile.coachId);
    } else {
      const saved = localStorage.getItem("careo_coach_id");
      if (saved) setCoachId(saved);
    }
  }, [profile?.coachId]);

  // 保存済み履歴を読み込む（初回のみ）
  useEffect(() => {
    if (!historyLoading && !initialized) {
      if (savedMessages.length > 0) {
        setLocalMessages(savedMessages.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt })));
      } else {
        // 新規チャット：PDCAがあればカレオ用のウェルカムメッセージを使用
        const pdca = getLastPdca();
        const savedCoachId = localStorage.getItem("careo_coach_id") ?? DEFAULT_COACH_ID;
        const coach = getCoachPersonality(savedCoachId);
        const welcomeContent = pdca?.check && savedCoachId === DEFAULT_COACH_ID
          ? `やあ！カレオだよ👋\n前回のPDCA分析を見たんだけど、スコアが${pdca.check.score}点だったね。${pdca.act?.nextWeekFocus ? `「${pdca.act.nextWeekFocus}」が今週の最重要テーマだよ。` : ""}一緒に課題を解決していこう！\n\n何か相談したいことある？`
          : coach.welcomeMessage;
        setLocalMessages([{ role: "assistant", content: welcomeContent, isWelcome: true }]);
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

  // 直近のPDCA結果を取得（Supabase優先、フォールバックはlocalStorage）
  const getLastPdca = () => {
    if (profile?.lastPdca) return profile.lastPdca;
    try {
      const raw = localStorage.getItem("careo_last_pdca");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.data ?? (parsed?.check ? parsed : null);
    } catch { return null; }
  };

  const buildContext = () => ({
    profile: profile ? {
      username: profile.username,
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
        existingProfile: {
          university: profile?.university ?? "",
          faculty: profile?.faculty ?? "",
          graduationYear: profile?.graduationYear,
          targetIndustries: profile?.targetIndustries ?? [],
        },
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
        companyStatusUpdates: { companyName: string; newStatus: string }[];
        profileUpdates: { university?: string; faculty?: string; graduationYear?: number; targetIndustries?: string[] };
      };

      // AIが生成した自己分析をai_self_analysisに保存（ユーザー入力は上書きしない）
      const saFields = Object.entries(result.selfAnalysis).filter(([, v]) => v && String(v).trim());
      if (saFields.length > 0) {
        const patch = Object.fromEntries(saFields.map(([k, v]) => [k, String(v).trim()]));
        const ok = await saveAiSelfAnalysis(patch as Parameters<typeof saveAiSelfAnalysis>[0]);
        if (ok) {
          const labels: Record<string, string> = {
            careerAxis: "就活の軸", gakuchika: "ガクチカ", selfPr: "自己PR",
            strengths: "強み", weaknesses: "弱み",
          };
          const fieldNames = saFields.map(([k]) => labels[k] ?? k).join("・");
          showToast(`${fieldNames}のAIメモを保存しました`, "success");
        }
      }

      // 新規企業の自動追加
      for (const rawName of result.newCompanies) {
        // AIがJSON文字列を返した場合はパースしてnameフィールドを抽出
        let name = rawName;
        if (typeof rawName === "string" && rawName.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(rawName) as { name?: string };
            if (parsed.name) name = parsed.name;
            else continue;
          } catch { continue; }
        }
        if (!name || !name.trim()) continue;
        const exists = companies.find(c => c.name === name);
        if (!exists) {
          await addCompany({ name: name.trim(), status: "WISHLIST", industry: "", notes: "カレオとのチャットから自動追加" });
          showToast(`「${name.trim()}」を企業管理に追加しました`, "success");
        }
      }

      // アクションアイテムの自動追加
      if (result.actionItems.length > 0) {
        await addItems(result.actionItems);
        if (result.actionItems.length > 0) {
          showToast(`${result.actionItems.length}件のアクションをダッシュボードに追加しました`, "info");
        }
      }

      // カレンダーイベントを最後のメッセージに付与 + 面接/GDはDBに自動保存
      if (result.calendarEvents && result.calendarEvents.length > 0) {
        setLocalMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== "assistant") return prev;
          return [...prev.slice(0, -1), { ...last, calendarEvents: result.calendarEvents }];
        });

        for (const event of result.calendarEvents) {
          if (event.type === "interview" && event.companyName && event.date) {
            const company = companies.find(c => c.name === event.companyName);
            if (!company) continue;
            // 同企業・同日の面接が既存にあれば重複追加しない
            const alreadyExists = interviews.some(
              i => i.companyId === company.id && i.scheduledAt?.startsWith(event.date)
            );
            if (alreadyExists) continue;
            const round = interviews.filter(i => i.companyId === company.id).length + 1;
            await addInterview({
              companyId: company.id,
              round,
              scheduledAt: event.date,
              notes: event.title,
              result: "PENDING",
              questions: [],
            });
            showToast(`「${event.companyName}」の予定をカレンダーに追加しました`, "success");
          }
        }
      }

      // 企業ステータスの自動更新
      if (result.companyStatusUpdates?.length > 0) {
        for (const update of result.companyStatusUpdates) {
          const company = companies.find(c => c.name === update.companyName);
          if (company) {
            await updateCompany(company.id, { status: update.newStatus as import("@/types").CompanyStatus });
            const statusLabels: Record<string, string> = {
              OFFERED: "内定", REJECTED: "不採用", FINAL: "最終面接",
              INTERVIEW_2: "2次面接", INTERVIEW_1: "1次面接", DOCUMENT: "書類選考",
              APPLIED: "応募済み", INTERN: "インターン中", INTERN_FINAL: "インターン最終面接",
            };
            showToast(`「${company.name}」のステータスを${statusLabels[update.newStatus] ?? update.newStatus}に更新しました`, "success");
          }
        }
      }

      // プロフィールの自動更新（自己分析フィールドは触らない）
      if (result.profileUpdates && Object.keys(result.profileUpdates).length > 0) {
        const validUpdates = Object.fromEntries(
          Object.entries(result.profileUpdates).filter(([, v]) => v !== undefined && v !== "")
        );
        if (Object.keys(validUpdates).length > 0) {
          await patchProfileBasics(validUpdates as Parameters<typeof patchProfileBasics>[0]);
          showToast("プロフィール情報を更新しました", "success");
        }
      }

      // PDCA更新が必要な場合はlocalStorageのキャッシュを削除して次回再取得を促す
      if (result.shouldRefreshPdca) {
        try { localStorage.removeItem("careo_last_pdca"); } catch { /* ignore */ }
      }
    } catch (err) {
      console.error("[chat-sync]", err);
    }
  }, [companies, interviews, profile, pendingItems, patchSelfAnalysis, patchProfileBasics, addCompany, updateCompany, addItems, addInterview, showToast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      showToast("ファイルサイズは5MB以下にしてください", "warning");
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "text/plain", "text/markdown", "text/csv"];
    if (!allowed.includes(file.type)) {
      showToast("画像・PDF・テキストファイルのみ対応しています", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      setFileAttachment({ name: file.name, type: file.type, data: base64 });
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (text: string) => {
    const hasFile = !!fileAttachment;
    if (!text.trim() && !hasFile) return;
    if (isStreaming) return;
    const attachedFile = fileAttachment;
    setInput("");
    setFileAttachment(null);
    setIsStreaming(true);

    const displayContent = attachedFile
      ? (text.trim() ? `📎 ${attachedFile.name}\n${text}` : `📎 ${attachedFile.name}`)
      : text;
    const userMsg: LocalMessage = { role: "user", content: displayContent, createdAt: new Date().toISOString() };
    setLocalMessages((prev) => [...prev, userMsg]);
    await saveMessage("user", displayContent);
    // 今日チャットしたことを記録（バッジ消去）— Supabase + localStorage両方更新
    saveLastChatAt(); // デバイス間同期（内部でlocalStorageも更新）
    thinkingMessageRef.current = getRandomThinkingMessage(getCoachPersonality(coachId));
    setLocalMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const historyForApi = localMessages
        .filter((m) => !m.streaming)
        .concat(userMsg)
        .filter((m) => !m.isWelcome)
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi, context: buildContext(), coachId, file: attachedFile }),
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
            createdAt: new Date().toISOString(),
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
    const ok = await saveAiSelfAnalysis({ [suggestion.field]: suggestion.content });
    if (ok) {
      showToast(`${SELF_ANALYSIS_LABELS[suggestion.field]}のAIメモを保存しました（自己分析ページで確認できます）`, "success");
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
    const coach = getCoachPersonality(coachId);
    setLocalMessages([{ role: "assistant", content: coach.welcomeMessage, isWelcome: true }]);
    setInitialized(false);
    setTimeout(() => setInitialized(true), 0);
  };

  const handleSelectCoach = (id: string) => {
    setCoachId(id);
    localStorage.setItem("careo_coach_id", id);
    saveCoachId(id); // Supabaseに保存してデバイス間同期
    const coach = getCoachPersonality(id);
    // ウェルカムメッセージのみの場合は差し替え
    setLocalMessages((prev) => {
      if (prev.length === 1 && prev[0].isWelcome) {
        return [{ role: "assistant", content: coach.welcomeMessage, isWelcome: true }];
      }
      return prev;
    });
    setShowCoachSelector(false);
  };

  // カレオが知っているデータ数
  const dataCount = companies.length + esList.length + interviews.length + visits.length + tests.length;
  const showSuggestions = localMessages.length <= 1 && !isStreaming;
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  return (
    <div ref={containerRef} className="flex flex-col overflow-hidden chat-container">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-gray-100 dark:border-[#2a2d37] bg-white dark:bg-[#0f1117] shrink-0">
        <button
          type="button"
          onClick={() => setShowCoachSelector(true)}
          className="shrink-0 group relative"
          title="コーチを変更"
        >
          <CoachAvatar coachId={coachId} />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="w-2 h-2 bg-gray-400 rounded-full text-[5px] flex items-center justify-center">▼</span>
          </span>
        </button>
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setShowCoachSelector(true)}
            className="flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            <h1 className="font-semibold text-gray-900">{getCoachPersonality(coachId).name}コーチ</h1>
            <span className="text-gray-400 text-xs">▾</span>
          </button>
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
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0f1117]">
        {historyLoading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              <div className="text-xs text-gray-400">履歴を読み込み中...</div>
            </div>
          </div>
        ) : (
          <div className="px-4 md:px-5 pt-4 pb-2 space-y-0.5">
            {localMessages.map((msg, i) => {
              const prevMsg = localMessages[i - 1];
              const nextMsg = localMessages[i + 1];
              const isFirstInGroup = !prevMsg || prevMsg.role !== msg.role || prevMsg.streaming;
              const isLastInGroup = !nextMsg || nextMsg.role !== msg.role;
              // 日付セパレーター表示判定
              const showDateSep = !!msg.createdAt && (
                !prevMsg?.createdAt ||
                !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt))
              );
              const dateSepLabel = showDateSep ? getDateLabel(msg.createdAt) : null;
              // バブルの角丸調整（グループ内は角を変える）
              const userBubble = isFirstInGroup
                ? "rounded-2xl rounded-tr-md"
                : isLastInGroup
                  ? "rounded-2xl rounded-tr-md"
                  : "rounded-xl";
              const aiBubble = isFirstInGroup
                ? "rounded-2xl rounded-tl-md"
                : isLastInGroup
                  ? "rounded-2xl rounded-tl-md"
                  : "rounded-xl";

              return (
                <div key={i}>
                  {/* 日付セパレーター */}
                  {dateSepLabel && (
                    <div className="flex items-center justify-center py-4">
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
                        {dateSepLabel}
                      </span>
                    </div>
                  )}

                  {/* メッセージ行 */}
                  <div className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} ${isLastInGroup ? "mb-3" : "mb-0.5"}`}>
                    {/* アバター：AIのグループ先頭のみ表示、それ以外はスペーサー */}
                    {msg.role === "assistant" ? (
                      isFirstInGroup ? (
                        <div className="shrink-0 self-end mb-0.5">
                          <CoachAvatar coachId={coachId} size={7} />
                        </div>
                      ) : (
                        <div className="w-7 shrink-0" />
                      )
                    ) : null}

                    <div className={`flex flex-col max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap ${
                          msg.role === "user"
                            ? `bg-[#2563EB] text-white ${userBubble} shadow-sm`
                            : `bg-gray-100 text-gray-800 ${aiBubble}`
                        }`}
                      >
                        {msg.content}
                        {msg.streaming && msg.content === "" && (
                          <span className="inline-flex items-center gap-1.5 text-gray-500 text-xs">
                            {thinkingMessageRef.current}
                            <span className="inline-flex gap-0.5 ml-1">
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </span>
                          </span>
                        )}
                      </div>

                      {/* タイムスタンプ + 音声ボタン：グループ最後のみ */}
                      {isLastInGroup && (
                        <div className={`flex items-center gap-1.5 mt-1 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                          {msg.createdAt && (
                            <span className="text-[10px] text-gray-400">
                              {formatTime(msg.createdAt)}
                            </span>
                          )}
                          {msg.role === "assistant" && !msg.streaming && msg.content && (
                            <button
                              type="button"
                              onClick={() => speak(msg.content)}
                              className="text-gray-300 hover:text-blue-400 transition-colors"
                              title="読み上げる"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* アクションカード類（アバタースペーサー分インデント） */}
                  {/* 自己分析保存ボタン */}
                  {msg.selfAnalysisSuggestions && msg.selfAnalysisSuggestions.length > 0 && (
                    <div className="ml-9 mt-2 mb-3 space-y-2">
                      {msg.selfAnalysisSuggestions.map((s) => {
                        const saved = msg.savedFields?.includes(s.field);
                        return (
                          <div key={s.field} className={`rounded-2xl border p-3.5 ${saved ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${saved ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                📝 {SELF_ANALYSIS_LABELS[s.field]}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSaveSelfAnalysis(i, s)}
                                disabled={saved}
                                className={`text-xs font-medium px-3 py-1.5 rounded-xl transition-colors shrink-0 ${
                                  saved
                                    ? "bg-green-200 text-green-700 cursor-default"
                                    : "bg-blue-600 text-white active:scale-95"
                                }`}
                              >
                                {saved ? "✓ 保存済み" : "自己分析に保存"}
                              </button>
                            </div>
                            <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">{s.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 企業追加候補ボタン */}
                  {msg.suggestedCompanies && msg.suggestedCompanies.length > 0 && (
                    <div className="ml-9 mt-2 mb-3 flex flex-wrap gap-2">
                      {msg.suggestedCompanies.map((name) => (
                        <button
                          type="button"
                          key={name}
                          onClick={() => handleAddCompany(name)}
                          className="text-xs bg-indigo-50 active:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-full px-3 py-1.5 transition-colors flex items-center gap-1.5 font-medium"
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
                    <div className="ml-9 mt-2 mb-3 space-y-2">
                      {msg.calendarEvents.map((event, j) => {
                        const eventDateLabel = (() => {
                          try {
                            const d = new Date(event.date);
                            return `${d.getMonth() + 1}/${d.getDate()}（${["日","月","火","水","木","金","土"][d.getDay()]}）`;
                          } catch { return event.date; }
                        })();
                        const href = event.type === "interview" ? "/interviews" : event.type === "deadline" ? "/es" : "/deadlines";
                        const linkLabel = event.type === "interview" ? "面接ログに追加" : event.type === "deadline" ? "ES締切に設定" : "カレンダーで確認";
                        return (
                          <div key={j} className="rounded-2xl border border-orange-200 bg-orange-50 p-3.5 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-orange-800">📅 {event.title}</p>
                              <p className="text-[11px] text-orange-600 mt-0.5">
                                {event.companyName ? `${event.companyName} · ` : ""}{eventDateLabel}
                              </p>
                            </div>
                            <a
                              href={href}
                              className="shrink-0 text-xs bg-orange-500 active:bg-orange-600 text-white font-medium px-3 py-1.5 rounded-xl transition-colors"
                            >
                              {linkLabel}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {showSuggestions && (
              <div className="ml-9 mt-1 mb-2">
                <p className="text-xs text-gray-400 mb-2">こんなことを聞いてみよう</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 active:bg-blue-50 active:border-blue-300 active:text-blue-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-white dark:bg-[#0f1117] border-t border-gray-100 dark:border-[#2a2d37] shrink-0">
        {/* クイック返信チップス */}
        {showQuickReplies && !isStreaming && (
          <div className="px-4 pt-2 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { sendMessage(s); setShowQuickReplies(false); }}
                className="text-xs bg-[#00c896]/10 border border-[#00c896]/30 text-[#00a87e] rounded-full px-3 py-1.5 whitespace-nowrap font-medium hover:bg-[#00c896]/20 transition-colors shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          aria-label="ファイルを添付"
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,text/markdown,text/csv"
          onChange={handleFileSelect}
        />
        {fileAttachment && (
          <div className="mx-3 mb-1 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="text-xs text-blue-700 font-medium truncate flex-1">{fileAttachment.name}</span>
            <button
              type="button"
              onClick={() => setFileAttachment(null)}
              className="text-blue-400 hover:text-blue-600 shrink-0"
              aria-label="添付を削除"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-4 py-3 flex items-end gap-2 bg-gray-50 dark:bg-[#1a1d27] mx-3 mb-3 rounded-2xl border border-gray-200 dark:border-[#2a2d37] focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-200 transition-all">
          {/* クイック返信トグル */}
          <button
            type="button"
            onClick={() => setShowQuickReplies(v => !v)}
            title="よく使うフレーズ"
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-colors ${
              showQuickReplies ? "bg-[#00c896]/20 text-[#00a87e]" : "text-gray-400 hover:text-[#00c896] hover:bg-[#00c896]/10"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          {/* ファイル添付ボタン */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="ファイルを添付（画像・PDF・テキスト）"
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-colors text-gray-400 hover:text-purple-500 hover:bg-purple-50"
            disabled={isStreaming}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          {/* 音声入力ボタン */}
          <button
            type="button"
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
            className="flex-1 bg-transparent text-sm resize-none outline-none text-gray-800 placeholder-gray-400 max-h-32 min-h-6"
            disabled={isStreaming || historyLoading}
          />
          <button
            type="button"
            title="送信"
            onClick={() => sendMessage(input)}
            disabled={(!input.trim() && !fileAttachment) || isStreaming || historyLoading}
            className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-1 mb-1">
          相談内容はあなた専用のAI分析に活かされます
        </p>
      </div>

      {/* コーチ選択パネル */}
      {showCoachSelector && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          onClick={() => setShowCoachSelector(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-base">コーチを選ぶ</h2>
              <button
                type="button"
                onClick={() => setShowCoachSelector(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              title="閉じる"
              aria-label="閉じる"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {COACH_PERSONALITIES.map((coach) => {
                const isSelected = coachId === coach.id;
                return (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => handleSelectCoach(coach.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                    }`}
                  >
                    {coach.avatarSvg ? (
                      <div
                        className="w-10 h-10 rounded-full shrink-0 shadow-sm overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: coach.avatarSvg }}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${coach.avatarGradient} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="text-white text-sm font-bold">{coach.avatarLabel}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm ${isSelected ? "text-blue-700" : "text-gray-900"}`}>{coach.name}</p>
                      <p className="text-xs text-gray-500 truncate">{coach.tagline}</p>
                    </div>
                    {isSelected && (
                      <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 text-center mt-4">コーチを変えても今後のメッセージから反映されます</p>
          </div>
        </div>
      )}
    </div>
  );
}
