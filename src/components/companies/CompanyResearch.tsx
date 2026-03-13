"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface ResearchResult {
  business: string;
  competitors: string[];
  motivationAngles: string[];
  strengths: string[];
  reverseQuestions: string[];
}

interface CompanyResearchProps {
  companyId: string;
  companyName: string;
  cachedResearch?: string | null;
  onSave: (json: string) => void;
}

export function CompanyResearch({ companyId: _companyId, companyName, cachedResearch, onSave }: CompanyResearchProps) {
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
        body: JSON.stringify({ companyName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      onSave(JSON.stringify(data));
    } catch {
      setError("企業研究の取得に失敗しました");
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
    <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h2 className="font-semibold text-gray-900">AI企業研究</h2>
        </div>
        <Button size="sm" onClick={handleResearch} disabled={loading}>
          {loading ? "調査中..." : result ? "再調査" : "AIで調査する"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {loading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!result && !loading && !error && (
        <p className="text-sm text-gray-400">ボタンを押すとAIが事業内容・競合・志望動機の切り口を整理します</p>
      )}

      {result && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">事業内容</h3>
            <p className="text-sm text-gray-700">{result.business}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">競合企業</h3>
            <div className="flex flex-wrap gap-2">
              {result.competitors.map((c, i) => (
                <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{c}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">志望動機の切り口</h3>
            <ul className="space-y-1">
              {result.motivationAngles.map((m, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-blue-400 shrink-0">›</span>{m}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">企業の強み</h3>
            <ul className="space-y-1">
              {result.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-green-400 shrink-0">›</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">逆質問候補</h3>
            <ul className="space-y-1">
              {result.reverseQuestions.map((q, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-purple-400 shrink-0">Q.</span>{q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
