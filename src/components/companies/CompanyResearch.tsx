"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useProfile } from "@/hooks/useProfile";

interface ResearchResult {
  business: string;
  competitors: string[];
  motivationAngles: string[];
  strengths: string[];
  reverseQuestions: string[];
  workStyle?: string;
  watchOut?: string;
}

interface CompanyResearchProps {
  companyId: string;
  companyName: string;
  cachedResearch?: string | null;
  onSave: (json: string) => void;
}

export function CompanyResearch({ companyId: _companyId, companyName, cachedResearch, onSave }: CompanyResearchProps) {
  const { profile } = useProfile();
  const [result, setResult] = useState<ResearchResult | null>(() => {
    if (cachedResearch) {
      try { return JSON.parse(cachedResearch); } catch { return null; }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResearch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/company-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          profile: profile ? {
            targetIndustries: profile.targetIndustries,
            targetJobs: profile.targetJobs,
            careerAxis: profile.careerAxis,
            strengths: profile.strengths,
            gakuchika: profile.gakuchika,
          } : undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      onSave(JSON.stringify(data));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "企業研究の取得に失敗しました";
      setError(msg.includes("多すぎ") ? msg : "企業研究の取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  // キャッシュがなければマウント時に自動取得
  useEffect(() => {
    if (!cachedResearch && !result) {
      handleResearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <h2 className="font-semibold text-gray-900">AI企業研究</h2>
            {profile?.targetIndustries?.length && (
              <p className="text-[10px] text-blue-500 mt-0.5">あなたのプロフィールに合わせて個別最適化</p>
            )}
          </div>
        </div>
        <Button size="sm" onClick={handleResearch} disabled={loading}>
          {loading ? "調査中..." : result ? "再調査" : "AIで調査する"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2">
          <span className="text-red-500 text-sm">✕</span>
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={handleResearch} className="ml-auto text-xs text-red-500 underline">再試行</button>
        </div>
      )}

      {loading && (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-3 bg-gray-100 rounded animate-pulse ${i % 2 === 0 ? "w-full" : "w-4/5"}`} />
          ))}
          <p className="text-xs text-gray-300 text-center mt-3">AIが{companyName}を分析中...</p>
        </div>
      )}

      {!result && !loading && !error && (
        <p className="text-sm text-gray-400">ボタンを押すとAIが事業内容・競合・志望動機の切り口を整理します</p>
      )}

      {result && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">事業内容</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{result.business}</p>
          </div>

          {result.workStyle && (
            <div>
              <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">働き方・社風</h3>
              <p className="text-sm text-gray-700">{result.workStyle}</p>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">競合企業</h3>
            <div className="flex flex-wrap gap-1.5">
              {result.competitors.map((c, i) => (
                <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{c}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">企業の強み</h3>
            <ul className="space-y-1">
              {result.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-green-400 shrink-0 mt-0.5">›</span>{s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              志望動機の切り口
              {profile?.careerAxis && <span className="ml-1 text-blue-400 normal-case font-normal">（あなたの軸に合わせて）</span>}
            </h3>
            <ul className="space-y-1">
              {result.motivationAngles.map((m, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-blue-400 shrink-0 mt-0.5">›</span>{m}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">逆質問候補</h3>
            <ul className="space-y-1">
              {result.reverseQuestions.map((q, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-purple-400 shrink-0 font-medium mt-0.5">Q.</span>{q}
                </li>
              ))}
            </ul>
          </div>

          {result.watchOut && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-700 flex gap-1.5">
                <span className="shrink-0">⚠</span>{result.watchOut}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
