"use client";

import { useState } from "react";
import { useCompanies } from "@/hooks/useCompanies";
import { useInterviews } from "@/hooks/useInterviews";
import { useEs } from "@/hooks/useEs";
import { useObVisits } from "@/hooks/useObVisits";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { KareoCharacter } from "@/components/kareo/KareoCharacter";

type Mode = "starter" | "checkpoint" | "reflection";
type Level = "beginner" | "intermediate" | "advanced";

interface CoachingResult {
  level: Level;
  headline: string;
  summary: string;
  actions: { title: string; reason: string; deadline?: string }[];
  watchOuts: string[];
  encouragement: string;
}

const MODE_OPTIONS: { value: Mode; label: string; emoji: string; desc: string }[] = [
  { value: "starter", label: "やり始めたい", emoji: "🚀", desc: "今から就活を始めるキックオフ" },
  { value: "checkpoint", label: "直前確認", emoji: "🎯", desc: "面接・締切の前に最終チェック" },
  { value: "reflection", label: "進捗を見る", emoji: "🔄", desc: "ここまでの進捗を整理して次の打ち手" },
];

const LEVEL_LABEL: Record<Level, string> = {
  beginner: "初級モード",
  intermediate: "中級モード",
  advanced: "上級モード",
};

const LEVEL_COLOR: Record<Level, string> = {
  beginner: "bg-blue-100 text-blue-700",
  intermediate: "bg-orange-100 text-orange-700",
  advanced: "bg-purple-100 text-purple-700",
};

export default function CoachingPage() {
  const { companies } = useCompanies();
  const { interviews } = useInterviews();
  const { esList } = useEs();
  const { visits } = useObVisits();
  const { profile } = useProfile();

  const [mode, setMode] = useState<Mode>("starter");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoachingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCoaching = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/coaching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          companies: companies.map(c => ({ id: c.id, status: c.status, name: c.name })),
          interviews: interviews.map(i => ({ result: i.result, round: i.round })),
          esCount: esList.length,
          obVisitCount: visits.length,
          mode,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">コーチングAI</h1>
          <p className="text-sm text-gray-500 mt-1">
            やり始めの不安にも、先を行くあなたの戦略にも、両方に応える専属コーチ
          </p>
        </div>

        {/* モード選択 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 mb-4">
          <p className="text-xs font-semibold text-gray-600 mb-3">どのコーチングを受ける？</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {MODE_OPTIONS.map((m) => {
              const sel = mode === m.value;
              return (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    sel ? "border-[#00c896] bg-[#00c896]/10" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{m.emoji}</span>
                    <span className={`text-sm font-bold ${sel ? "text-[#00a87e]" : "text-gray-900"}`}>{m.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-tight">{m.desc}</p>
                </button>
              );
            })}
          </div>

          <Button
            onClick={runCoaching}
            disabled={loading}
            className="w-full mt-4"
          >
            {loading ? "コーチが考えています..." : "コーチングを受ける"}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* 結果 */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gradient-to-br from-[#00c896]/10 to-blue-50 rounded-2xl border border-[#00c896]/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLOR[result.level]}`}>
                  {LEVEL_LABEL[result.level]}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{result.headline}</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
            </div>

            {result.actions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                  <span>👉</span> 今やるべきこと
                </h3>
                <div className="space-y-2.5">
                  {result.actions.map((a, i) => (
                    <div key={i} className="border-l-4 border-[#00c896] pl-3 py-1">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <p className="text-sm font-bold text-gray-900">{a.title}</p>
                        {a.deadline && (
                          <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full shrink-0">
                            {a.deadline}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{a.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.watchOuts.length > 0 && (
              <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-5">
                <h3 className="text-sm font-bold text-yellow-900 mb-2 flex items-center gap-1.5">
                  <span>⚠️</span> 注意点
                </h3>
                <ul className="space-y-1.5">
                  {result.watchOuts.map((w, i) => (
                    <li key={i} className="text-sm text-yellow-900 leading-relaxed">・{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.encouragement && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-3">
                <KareoCharacter expression="encouraging" size={56} className="shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">カレオから一言</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{result.encouragement}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-8 text-gray-400">
            <KareoCharacter expression="thinking" size={80} className="mx-auto mb-3" />
            <p className="text-sm">モードを選んでコーチングを開始しましょう</p>
          </div>
        )}
      </div>
    </div>
  );
}
