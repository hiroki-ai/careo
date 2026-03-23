"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { useProfile } from "@/hooks/useProfile";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { CompanyStatus, COMPANY_STATUS_LABELS, COMPANY_STATUS_ORDER } from "@/types";

const SUGGEST_CACHE_KEY = "careo_company_suggestions";
const SUGGEST_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface Suggestion {
  name: string;
  industry: string;
  reason: string;
  tag: string;
}

const TAG_STYLES: Record<string, string> = {
  "類似企業": "bg-blue-50 text-blue-700",
  "代替候補": "bg-orange-50 text-orange-700",
  "軸にマッチ": "bg-[#00c896]/10 text-[#00a87e]",
  "成長企業": "bg-purple-50 text-purple-700",
  "穴場": "bg-yellow-50 text-yellow-700",
};

export default function CompaniesPage() {
  const { companies, addCompany } = useCompanies();
  const { profile } = useProfile();
  const { showToast } = useToast();
  const hasIntern = companies.some(c => c.status === "INTERN" || c.status === "INTERN_APPLYING");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // AI企業提案
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());

  const hasRejected = companies.some(c => c.status === "REJECTED");
  const showSuggestBanner = companies.length < 8 || hasRejected;

  // キャッシュから読み込み
  useEffect(() => {
    try {
      const cached = localStorage.getItem(SUGGEST_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached) as { data: Suggestion[]; ts: number };
        if (Date.now() - ts < SUGGEST_CACHE_TTL) {
          setSuggestions(data);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setSuggestLoading(true);
    setSuggestOpen(true);
    try {
      const res = await fetch("/api/ai/company-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            careerAxis: profile?.careerAxis,
            targetIndustries: profile?.targetIndustries,
            targetJobs: profile?.targetJobs,
            selfPr: profile?.selfPr,
            strengths: profile?.strengths,
          },
          companies: companies.map(c => ({ name: c.name, industry: c.industry, status: c.status })),
        }),
      });
      if (!res.ok) return;
      const json = await res.json() as { suggestions?: Suggestion[] };
      const data = json.suggestions ?? [];
      setSuggestions(data);
      localStorage.setItem(SUGGEST_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } finally {
      setSuggestLoading(false);
    }
  }, [profile, companies]);

  const handleAddSuggestion = useCallback(async (s: Suggestion) => {
    await addCompany({ name: s.name, status: "WISHLIST", industry: s.industry, notes: "" });
    setAddedNames(prev => new Set([...prev, s.name]));
    // キャッシュを無効化（追加した企業が次回提案に含まれないよう）
    localStorage.removeItem(SUGGEST_CACHE_KEY);
  }, [addCompany]);

  const handleBulkImport = async () => {
    const lines = importText
      .split(/[\n,]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      showToast("企業名を入力してください", "warning");
      return;
    }

    setImporting(true);
    try {
      for (const name of lines) {
        await addCompany({ name, status: "WISHLIST", industry: "", notes: "" });
      }
      showToast(`${lines.length}社を追加しました`, "success");
      setImportText("");
      setIsImportOpen(false);
    } catch (err) {
      console.error("[bulkImport]", err);
      showToast("インポートに失敗しました", "error");
    } finally {
      setImporting(false);
    }
  };

  const filtered = companies
    .filter((c) => filterStatus === "ALL" || c.status === filterStatus)
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.industry ?? "").toLowerCase().includes(q);
    });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企業管理</h1>
          <p className="text-sm text-gray-500 mt-1">{companies.length}社を管理中</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
            <span className="hidden sm:inline">一括インポート</span>
            <span className="sm:hidden">インポート</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <span className="hidden sm:inline">+ 企業を追加</span>
            <span className="sm:hidden">+ 追加</span>
          </Button>
        </div>
      </div>

      {/* 検索 */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="企業名・業界で検索..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* フィルター */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            filterStatus === "ALL" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          すべて ({companies.length})
        </button>
        {COMPANY_STATUS_ORDER.map((s) => {
          const count = companies.filter((c) => c.status === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                filterStatus === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {COMPANY_STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* AI企業提案バナー */}
      {showSuggestBanner && (
        <div className="mb-6 rounded-2xl border border-[#00c896]/30 bg-gradient-to-r from-[#00c896]/5 to-emerald-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">✨</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">
                  {hasRejected ? "不採用を踏まえたおすすめ企業を提案します" : "もっと受けるべき企業を提案します"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">自己分析・選考状況をもとにAIが分析</p>
              </div>
            </div>
            <button
              type="button"
              onClick={suggestOpen ? () => setSuggestOpen(false) : fetchSuggestions}
              className="shrink-0 text-xs font-bold text-[#00a87e] border border-[#00c896]/50 hover:bg-[#00c896]/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              {suggestOpen ? "閉じる" : suggestions.length > 0 ? "提案を見る" : "分析する"}
            </button>
          </div>

          {suggestOpen && (
            <div className="mt-4">
              {suggestLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                  <svg className="animate-spin w-4 h-4 text-[#00c896]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  AIが企業を分析中...
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {suggestions.map((s) => {
                    const alreadyAdded = addedNames.has(s.name) || companies.some(c => c.name === s.name);
                    return (
                      <div key={s.name} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                            {s.industry && <span className="text-xs text-gray-400">{s.industry}</span>}
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TAG_STYLES[s.tag] ?? "bg-gray-100 text-gray-600"}`}>
                              {s.tag}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{s.reason}</p>
                        </div>
                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => handleAddSuggestion(s)}
                          className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                            alreadyAdded
                              ? "bg-gray-100 text-gray-400 cursor-default"
                              : "bg-[#00c896] text-white hover:bg-[#00a87e]"
                          }`}
                        >
                          {alreadyAdded ? "追加済" : "+ 追加"}
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={fetchSuggestions}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
                  >
                    再分析する →
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* 企業一覧 */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>企業が登録されていません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 leading-tight">{company.name}</h3>
                  <StatusBadge
                    status={company.status}
                    label={company.status === "OFFERED" ? (company.is_intern_offer ? "インターン合格" : "内定") : undefined}
                    className="ml-2 shrink-0"
                  />
                </div>
                {company.industry && (
                  <p className="text-sm text-gray-500 mb-2">{company.industry}</p>
                )}
                {company.notes && (
                  <p className="text-sm text-gray-600 line-clamp-2">{company.notes}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* インターン中の場合：服装バナー */}
      {hasIntern && (
        <div className="mt-6 flex items-center justify-between gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
          <p className="text-sm text-teal-800">👔 インターン中の服装に</p>
          <a
            href="https://px.a8.net/svt/ejp?a8mat=4AZIOB+402X6A+537A+5YJRM"
            rel="nofollow"
            target="_blank"
            className="shrink-0 text-xs font-bold text-teal-700 border border-teal-300 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            ORIHICA →
          </a>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img width={1} height={1} src="https://www12.a8.net/0.gif?a8mat=4AZIOB+402X6A+537A+5YJRM" alt="" style={{ display: "none" }} />
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="企業を追加">
        <CompanyForm
          onSubmit={(data) => {
            addCompany(data);
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
          submitLabel="追加する"
        />
      </Modal>

      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="企業を一括インポート">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">企業名を1行または1社ずつ入力してください。</p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder={"企業名を1行に1社ずつ入力してください\n例:\nトヨタ自動車\nソニーグループ\n楽天グループ"}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsImportOpen(false)} disabled={importing}>
              キャンセル
            </Button>
            <Button onClick={handleBulkImport} disabled={importing}>
              {importing ? "追加中..." : "追加する"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
