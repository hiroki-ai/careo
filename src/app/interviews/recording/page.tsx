"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useInterviewRecordings } from "@/hooks/useInterviewRecordings";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { Button } from "@/components/ui/Button";

export default function InterviewRecordingPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400">読み込み中...</div>}>
      <InterviewRecordingPage />
    </Suspense>
  );
}

function InterviewRecordingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const linkedInterviewId = searchParams.get("interviewId");

  const { addRecording } = useInterviewRecordings();
  const { interviews } = useInterviews();
  const { companies } = useCompanies();

  const [companyName, setCompanyName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [interviewId, setInterviewId] = useState<string | null>(linkedInterviewId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (linkedInterviewId) {
      const interview = interviews.find((i) => i.id === linkedInterviewId);
      if (interview) {
        const company = companies.find((c) => c.id === interview.companyId);
        if (company) setCompanyName(company.name);
      }
    }
  }, [linkedInterviewId, interviews, companies]);

  const handleSave = async () => {
    if (!transcript.trim()) {
      setError("文字起こしテキストを入力してください。");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addRecording({
        interviewId: interviewId || null,
        companyName: companyName || null,
        recordingType: "text_paste",
        transcript,
        durationSeconds: null,
      });
      router.push(interviewId ? `/interviews/${interviewId}` : "/interviews");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link href="/interviews" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
        ← 面接一覧
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">面接文字起こしのインポート</h1>
        <p className="text-sm text-gray-500 mt-1">
          面接の文字起こしを保存できます。録音の文字起こしは <a href="https://notta.ai" target="_blank" rel="noopener noreferrer" className="text-[#00a87e] hover:underline">Notta</a> や <a href="https://www.rimo.app/" target="_blank" rel="noopener noreferrer" className="text-[#00a87e] hover:underline">Rimo Voice</a> などの外部サービスをご利用ください。
        </p>
      </div>

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

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          文字起こし / 面接メモ
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={14}
          placeholder={`例:\n面接官: 自己紹介をお願いします。\n自分: はい、〇〇大学の△△と申します。...\n\n面接官: 学生時代に力を入れたことを教えてください。\n自分: 私が学生時代に最も力を入れたのは...`}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/30 focus:border-[#00c896] resize-y"
        />
        <p className="text-xs text-gray-400 mt-1">{transcript.length}文字</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving || !transcript.trim()}
        className="w-full"
      >
        {saving ? "保存中..." : "保存する"}
      </Button>
    </div>
  );
}
