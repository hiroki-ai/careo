"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Tab = "summary" | "es" | "interviews";

interface CompanySummary {
  company_name: string;
  industry: string;
  es_count: number;
  interview_count: number;
}

interface SenpaiEs {
  id: string;
  company_name: string;
  industry: string;
  title: string;
  questions: { question: string; answer: string }[];
  result: string;
  graduation_year: number;
  created_at: string;
}

interface SenpaiInterview {
  id: string;
  company_name: string;
  industry: string;
  round: number;
  questions: { question: string; answer: string }[];
  notes: string;
  result: string;
  graduation_year: number;
  created_at: string;
}

function resultBadge(result: string): { label: string; color: string } {
  if (result === "passed" || result === "PASS") return { label: "通過", color: "bg-emerald-100 text-emerald-700" };
  if (result === "failed" || result === "FAIL") return { label: "不通過", color: "bg-red-100 text-red-600" };
  return { label: "結果待ち", color: "bg-gray-100 text-gray-500" };
}

export default function SenpaiPage() {
  const [tab, setTab] = useState<Tab>("summary");
  const [summary, setSummary] = useState<CompanySummary[]>([]);
  const [esList, setEsList] = useState<SenpaiEs[]>([]);
  const [interviews, setInterviews] = useState<SenpaiInterview[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/senpai?type=summary");
      const data = await res.json();
      setSummary(data.summary ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEs = useCallback(async (company: string | null) => {
    setLoading(true);
    try {
      const q = company ? `&company=${encodeURIComponent(company)}` : "";
      const res = await fetch(`/api/senpai?type=es${q}`);
      const data = await res.json();
      setEsList(data.es ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInterviews = useCallback(async (company: string | null) => {
    setLoading(true);
    try {
      const q = company ? `&company=${encodeURIComponent(company)}` : "";
      const res = await fetch(`/api/senpai?type=interviews${q}`);
      const data = await res.json();
      setInterviews(data.interviews ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "summary") void loadSummary();
    if (tab === "es") void loadEs(selectedCompany);
    if (tab === "interviews") void loadInterviews(selectedCompany);
  }, [tab, selectedCompany, loadSummary, loadEs, loadInterviews]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00c896]/10 text-[#00a87e] text-xs font-bold mb-2">
          NEW · 先輩データ
        </div>
        <h1 className="text-2xl font-bold text-gray-900">先輩の就活データ</h1>
        <p className="text-sm text-gray-500 mt-1">
          27/28卒の先輩が匿名で共有したES・面接質問を閲覧できます。
        </p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {[
          { key: "summary" as const, label: "企業一覧", emoji: "🏢" },
          { key: "es" as const, label: "匿名ES", emoji: "📝" },
          { key: "interviews" as const, label: "面接質問", emoji: "🎤" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* 選択中の企業 */}
      {selectedCompany && tab !== "summary" && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-gray-500">企業:</span>
          <span className="px-2 py-1 rounded-full bg-[#00c896]/10 text-[#00a87e] text-xs font-bold">
            {selectedCompany}
          </span>
          <button
            type="button"
            onClick={() => setSelectedCompany(null)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            クリア ×
          </button>
        </div>
      )}

      {loading && (
        <div className="text-center py-10 text-sm text-gray-400">読み込み中...</div>
      )}

      {/* 企業一覧（summary） */}
      {tab === "summary" && !loading && (
        <>
          {summary.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
              <p className="text-sm font-semibold text-amber-900 mb-1">まだ共有データがありません</p>
              <p className="text-xs text-amber-700">先輩ユーザーが匿名共有をONにすると、ここに表示されます。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.map((c) => (
                <div
                  key={c.company_name}
                  className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow"
                >
                  <p className="text-base font-bold text-gray-900 mb-1">{c.company_name}</p>
                  {c.industry && <p className="text-[11px] text-gray-500 mb-3">{c.industry}</p>}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[10px] text-emerald-700 font-semibold">ES</p>
                      <p className="text-lg font-black text-emerald-600">{c.es_count}</p>
                    </div>
                    <div className="flex-1 bg-purple-50 border border-purple-100 rounded-lg px-2 py-1.5 text-center">
                      <p className="text-[10px] text-purple-700 font-semibold">面接</p>
                      <p className="text-lg font-black text-purple-600">{c.interview_count}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {c.es_count > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSelectedCompany(c.company_name); setTab("es"); }}
                        className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        ES見る
                      </button>
                    )}
                    {c.interview_count > 0 && (
                      <button
                        type="button"
                        onClick={() => { setSelectedCompany(c.company_name); setTab("interviews"); }}
                        className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                      >
                        面接見る
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 匿名ES一覧 */}
      {tab === "es" && !loading && (
        <div className="space-y-3">
          {esList.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
              <p className="text-sm text-amber-900">条件に合う匿名ESがまだありません</p>
            </div>
          ) : esList.map((es) => {
            const badge = resultBadge(es.result);
            return (
              <div key={es.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-900">{es.company_name}</span>
                  {es.industry && <span className="text-[10px] text-gray-400">· {es.industry}</span>}
                  <span className="text-[10px] text-gray-400">· {es.graduation_year}卒</span>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{es.title}</p>
                <div className="space-y-3">
                  {es.questions.map((qa, i) => (
                    <div key={i} className="border-l-2 border-[#00c896]/40 pl-3">
                      <p className="text-xs font-bold text-gray-700 mb-1">Q{i + 1}. {qa.question}</p>
                      <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{qa.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 面接質問一覧 */}
      {tab === "interviews" && !loading && (
        <div className="space-y-3">
          {interviews.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
              <p className="text-sm text-amber-900">条件に合う匿名面接データがまだありません</p>
            </div>
          ) : interviews.map((iv) => {
            const badge = resultBadge(iv.result);
            return (
              <div key={iv.id} className="bg-white border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-gray-900">{iv.company_name}</span>
                  {iv.industry && <span className="text-[10px] text-gray-400">· {iv.industry}</span>}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{iv.round}次面接</span>
                  <span className="text-[10px] text-gray-400">· {iv.graduation_year}卒</span>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                </div>
                {iv.questions.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {iv.questions.map((qa, i) => (
                      <div key={i} className="border-l-2 border-purple-300 pl-3">
                        <p className="text-xs font-bold text-gray-700 mb-1">Q{i + 1}. {qa.question}</p>
                        {qa.answer && <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{qa.answer}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {iv.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-gray-500 mb-1">メモ</p>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{iv.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 bg-gradient-to-r from-[#00c896]/10 to-[#00a87e]/10 border border-[#00c896]/25 rounded-2xl p-5">
        <p className="text-sm font-bold text-gray-900 mb-1">🤝 後輩に貢献したい先輩の方へ</p>
        <p className="text-xs text-gray-600 mb-3">
          あなたが登録したES・面接ログを匿名で後輩に公開できます。企業名・業界のみ表示、個人情報は含まれません。
        </p>
        <div className="flex gap-2">
          <Link href="/es" className="text-xs font-bold text-[#00a87e] hover:underline">
            ES一覧で共有設定 →
          </Link>
          <Link href="/interviews" className="text-xs font-bold text-[#00a87e] hover:underline">
            面接ログで共有設定 →
          </Link>
        </div>
      </div>
    </div>
  );
}
