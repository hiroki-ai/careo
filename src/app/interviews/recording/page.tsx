"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";
import { useInterviewRecordings } from "@/hooks/useInterviewRecordings";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { Button } from "@/components/ui/Button";
import { InterviewAIFeedback } from "@/types";

type TabType = "upload" | "record" | "paste";

export default function InterviewRecordingPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400">読み込み中...</div>}>
      <InterviewRecordingPage />
    </Suspense>
  );
}

function InterviewRecordingPage() {
  const searchParams = useSearchParams();
  const linkedInterviewId = searchParams.get("interviewId");

  const { addRecording, updateRecording } = useInterviewRecordings();
  const { interviews } = useInterviews();
  const { companies } = useCompanies();

  const [activeTab, setActiveTab] = useState<TabType>("paste");
  const [companyName, setCompanyName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [interviewId, setInterviewId] = useState<string | null>(linkedInterviewId);

  // Audio upload
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Transcription
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeMethod, setTranscribeMethod] = useState<"gemini" | "browser">("gemini");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // AI Feedback
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<InterviewAIFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Expandable question analysis
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  // Prefill company name from linked interview
  useEffect(() => {
    if (linkedInterviewId) {
      const interview = interviews.find((i) => i.id === linkedInterviewId);
      if (interview) {
        const company = companies.find((c) => c.id === interview.companyId);
        if (company) setCompanyName(company.name);
      }
    }
  }, [linkedInterviewId, interviews, companies]);

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [audioUrl, recordedUrl]);

  // ── Audio Upload ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
  };

  // ── Audio Recording ──
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setError("マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── Web Speech API Transcription ──
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognitionAPI = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("お使いのブラウザはWeb Speech APIに対応していません。Chrome/Edgeをお使いください。");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionAPI as any)();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = transcript;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      setIsTranscribing(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsTranscribing(true);
  }, [transcript]);

  const stopSpeechRecognition = () => {
    recognitionRef.current?.stop();
    setIsTranscribing(false);
  };

  // ── Gemini AI Transcription ──
  const transcribeWithGemini = async (audioSource: File | Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const formData = new FormData();
      if (audioSource instanceof File) {
        formData.append("audio", audioSource);
      } else {
        formData.append("audio", audioSource, "recording.webm");
      }

      const res = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "文字起こしに失敗しました");
      }

      const data = await res.json();
      setTranscript(data.transcript);
    } catch (e) {
      setError(e instanceof Error ? e.message : "文字起こしに失敗しました");
    } finally {
      setIsTranscribing(false);
    }
  };

  // ── AI Feedback ──
  const handleGetFeedback = async () => {
    if (!transcript.trim()) {
      setError("トランスクリプトを入力してください。");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setFeedback(null);

    try {
      // Save recording first
      const recording = await addRecording({
        interviewId: interviewId || null,
        companyName: companyName || null,
        recordingType: activeTab === "upload" ? "audio_upload" : activeTab === "record" ? "audio_record" : "text_paste",
        transcript,
        durationSeconds: activeTab === "record" ? recordingTime : null,
      });

      await updateRecording(recording.id, { status: "analyzing" });

      const res = await fetch("/api/ai/interview-recording-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          companyName: companyName || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "フィードバックの生成に失敗しました");
      }

      const data: InterviewAIFeedback = await res.json();
      setFeedback(data);
      await updateRecording(recording.id, { aiFeedback: data, status: "completed" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const tabs: { key: TabType; label: string; emoji: string }[] = [
    { key: "paste", label: "テキスト貼り付け", emoji: "📝" },
    { key: "upload", label: "音声アップロード", emoji: "📁" },
    { key: "record", label: "録音する", emoji: "🎙️" },
  ];

  const radarData = feedback?.communicationScore
    ? [
        { subject: "明瞭さ", value: feedback.communicationScore.clarity },
        { subject: "構成力", value: feedback.communicationScore.structure },
        { subject: "熱意", value: feedback.communicationScore.enthusiasm },
        { subject: "具体性", value: feedback.communicationScore.specificity },
      ]
    : [];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link href="/interviews" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
        ← 面接一覧
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">面接録音AI</h1>
        <p className="text-sm text-gray-500 mt-1">
          面接の録音やメモからAIフィードバックを受け取れます
        </p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{tab.emoji}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 企業名入力 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">企業名（任意）</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="例: 株式会社〇〇"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/30 focus:border-[#00c896]"
        />
      </div>

      {/* リンク済み面接の選択 */}
      {interviews.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">関連する面接（任意）</label>
          <select
            value={interviewId || ""}
            onChange={(e) => setInterviewId(e.target.value || null)}
            title="関連する面接を選択"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/30 focus:border-[#00c896] bg-white"
          >
            <option value="">選択しない</option>
            {interviews.map((iv) => {
              const co = companies.find((c) => c.id === iv.companyId);
              return (
                <option key={iv.id} value={iv.id}>
                  {co?.name || "不明"} - {iv.round}次面接
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Tab 1: Upload Audio */}
      {activeTab === "upload" && (
        <div className="space-y-4 mb-6">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.webm,.m4a"
              onChange={handleFileSelect}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-sm font-medium text-gray-700">
                {audioFile ? audioFile.name : "音声ファイルを選択"}
              </p>
              <p className="text-xs text-gray-400 mt-1">MP3, WAV, WebM, M4A対応</p>
            </label>
          </div>

          {audioUrl && (
            <div className="bg-gray-50 rounded-xl p-4">
              <audio controls src={audioUrl} className="w-full" />
            </div>
          )}

          {/* Gemini AI Transcription */}
          {audioFile && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✨</span>
                <p className="text-sm text-emerald-800 font-semibold">Gemini AIで自動文字起こし</p>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">推奨</span>
              </div>
              <p className="text-xs text-emerald-700 mb-3">
                音声ファイルをGemini AIが解析し、面接官・候補者を自動で区別して文字起こしします。
              </p>
              <button
                onClick={() => transcribeWithGemini(audioFile)}
                disabled={isTranscribing}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isTranscribing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AIが文字起こし中...
                  </>
                ) : (
                  "AIで文字起こし開始"
                )}
              </button>
            </div>
          )}

          <details className="group">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
              ブラウザの音声認識を使う（精度低め）
            </summary>
            <div className="bg-blue-50 rounded-xl p-4 mt-2">
              <p className="text-xs text-blue-600 mb-3">
                ブラウザ内蔵の音声認識で文字起こしします。精度はGemini AIより劣ります。
              </p>
              <button
                onClick={isTranscribing ? stopSpeechRecognition : startSpeechRecognition}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isTranscribing
                    ? "bg-red-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isTranscribing ? "文字起こし停止" : "ブラウザ文字起こし開始"}
              </button>
            </div>
          </details>
        </div>
      )}

      {/* Tab 2: Record Audio */}
      {activeTab === "record" && (
        <div className="space-y-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            {!isRecording && !recordedBlob && (
              <div>
                <div className="text-5xl mb-4">🎙️</div>
                <p className="text-sm text-gray-500 mb-4">ブラウザで面接を録音します</p>
                <Button onClick={startRecording}>録音開始</Button>
              </div>
            )}

            {isRecording && (
              <div>
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                  <span className="animate-ping absolute w-20 h-20 rounded-full bg-red-200" />
                  <span className="relative w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-2xl">🎙️</span>
                  </span>
                </div>
                <p className="text-2xl font-mono font-bold text-gray-900 mb-4">{formatTime(recordingTime)}</p>
                <Button variant="destructive" onClick={stopRecording}>録音停止</Button>
              </div>
            )}

            {recordedBlob && !isRecording && (
              <div>
                <p className="text-sm text-gray-500 mb-3">録音時間: {formatTime(recordingTime)}</p>
                <audio controls src={recordedUrl || undefined} className="w-full mb-4" />
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setRecordedBlob(null);
                      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
                      setRecordedUrl(null);
                      setRecordingTime(0);
                    }}
                  >
                    やり直す
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Gemini AI Transcription for recorded audio */}
          {recordedBlob && !isRecording && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✨</span>
                <p className="text-sm text-emerald-800 font-semibold">Gemini AIで自動文字起こし</p>
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">推奨</span>
              </div>
              <p className="text-xs text-emerald-700 mb-3">
                録音した音声をGemini AIが解析し、面接官・候補者を自動で区別して文字起こしします。
              </p>
              <button
                type="button"
                onClick={() => transcribeWithGemini(recordedBlob)}
                disabled={isTranscribing}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isTranscribing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AIが文字起こし中...
                  </>
                ) : (
                  "AIで文字起こし開始"
                )}
              </button>
            </div>
          )}

          <details className="group">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
              ブラウザの音声認識を使う（精度低め）
            </summary>
            <div className="bg-blue-50 rounded-xl p-4 mt-2">
              <p className="text-xs text-blue-600 mb-3">
                ブラウザ内蔵の音声認識で文字起こしします。
              </p>
              <button
                type="button"
                onClick={isTranscribing ? stopSpeechRecognition : startSpeechRecognition}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isTranscribing
                    ? "bg-red-500 text-white"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {isTranscribing ? "文字起こし停止" : "ブラウザ文字起こし開始"}
              </button>
            </div>
          </details>
        </div>
      )}

      {/* Tab 3: Paste Transcript - just the textarea below */}
      {activeTab === "paste" && (
        <div className="mb-2">
          <p className="text-sm text-gray-500 mb-3">
            面接の内容をテキストで貼り付けてください。質問と回答がわかるように記述すると、より精度の高いフィードバックが得られます。
          </p>
        </div>
      )}

      {/* Transcript textarea (shared across all tabs) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          トランスクリプト / 面接メモ
          {isTranscribing && (
            <span className="ml-2 text-xs text-red-500 animate-pulse">文字起こし中...</span>
          )}
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={12}
          placeholder={`例:\n面接官: 自己紹介をお願いします。\n自分: はい、〇〇大学の△△と申します。...\n\n面接官: 学生時代に力を入れたことを教えてください。\n自分: 私が学生時代に最も力を入れたのは...`}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/30 focus:border-[#00c896] resize-y"
        />
        <p className="text-xs text-gray-400 mt-1">{transcript.length}文字</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      {!feedback && (
        <div className="mb-8">
          <Button
            onClick={handleGetFeedback}
            disabled={isAnalyzing || !transcript.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AIが分析中...
              </span>
            ) : (
              "AIフィードバックを取得"
            )}
          </Button>
        </div>
      )}

      {/* ── AI Feedback Results ── */}
      {feedback && (
        <div className="space-y-6 mb-8">
          {/* Overall Score */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">総合評価</h2>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke={feedback.overallScore >= 70 ? "#00c896" : feedback.overallScore >= 40 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${feedback.overallScore * 2.64} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{feedback.overallScore}</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 leading-relaxed">{feedback.summary}</p>
              </div>
            </div>
          </div>

          {/* Strengths / Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-5">
              <p className="text-sm font-semibold text-green-700 mb-3">良かった点</p>
              <ul className="space-y-2">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 text-green-500">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 rounded-xl p-5">
              <p className="text-sm font-semibold text-amber-700 mb-3">改善点</p>
              <ul className="space-y-2">
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 text-amber-500">!</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Communication Radar Chart */}
          {feedback.communicationScore && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">コミュニケーション評価</h2>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#6b7280" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="スコア"
                      dataKey="value"
                      stroke="#00c896"
                      fill="#00c896"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {radarData.map((d) => (
                  <div key={d.subject} className="text-center">
                    <p className="text-xs text-gray-500">{d.subject}</p>
                    <p className="text-lg font-bold text-gray-900">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Analysis */}
          {feedback.questionAnalysis && feedback.questionAnalysis.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">設問別分析</h2>
              <div className="space-y-3">
                {feedback.questionAnalysis.map((qa, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-gray-900 truncate">Q: {qa.question}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          qa.score >= 7 ? "bg-green-100 text-green-700" :
                          qa.score >= 4 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {qa.score}/10
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${expandedQ === i ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {expandedQ === i && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">あなたの回答</p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{qa.answer}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">フィードバック</p>
                          <p className="text-sm text-gray-700">{qa.feedback}</p>
                        </div>
                        {qa.improvedAnswer && (
                          <div className="bg-[#00c896]/5 rounded-lg p-3 border border-[#00c896]/20">
                            <p className="text-xs font-medium text-[#00a87e] mb-1">改善回答例</p>
                            <p className="text-sm text-gray-700">{qa.improvedAnswer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {feedback.tips && feedback.tips.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-5">
              <p className="text-sm font-semibold text-blue-700 mb-3">次回に向けたアドバイス</p>
              <ul className="space-y-2">
                {feedback.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Retry button */}
          <div className="text-center">
            <Button
              variant="secondary"
              onClick={() => {
                setFeedback(null);
                setError(null);
              }}
            >
              別のトランスクリプトで再分析
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
