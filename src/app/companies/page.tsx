"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { useCompanies } from "@/hooks/useCompanies";
import { useProfile } from "@/hooks/useProfile";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { CsvImportModal } from "@/components/companies/CsvImportModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useToast } from "@/components/ui/Toast";
import { Company, CompanyStatus, COMPANY_STATUS_LABELS, COMPANY_STATUS_ORDER } from "@/types";
import { KareoCharacter } from "@/components/kareo/KareoCharacter";
import { daysUntil } from "@/lib/utils";
import { PageTutorial, PAGE_TUTORIALS } from "@/components/PageTutorial";

// モバイル：左スワイプでクイックアクション
function SwipeableCompanyCard({ company, onDelete, onStatusChange }: {
  company: Company;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: CompanyStatus) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const dragging = useRef(false);
  const currentX = useRef(0);

  const setX = (x: number, animate: boolean) => {
    if (!cardRef.current) return;
    currentX.current = x;
    cardRef.current.style.transition = animate ? "transform 0.2s ease" : "none";
    cardRef.current.style.transform = `translateX(${x}px)`;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    dragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!dragging.current && Math.abs(dy) > Math.abs(dx)) return;
    dragging.current = true;
    const base = isOpen ? -104 : 0;
    setX(Math.min(0, Math.max(base + dx, -104)), false);
  };

  const handleTouchEnd = () => {
    if (currentX.current < -52) { setX(-104, true); setIsOpen(true); }
    else { setX(0, true); setIsOpen(false); }
  };

  const close = () => { setX(0, true); setIsOpen(false); };

  const QUICK: { status: CompanyStatus; label: string; cls: string }[] = [
    { status: "INTERVIEW_1", label: "1次", cls: "bg-orange-500" },
    { status: "OFFERED", label: "内定", cls: "bg-green-500" },
    { status: "REJECTED", label: "NG", cls: "bg-red-500" },
  ];

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* アクションボタン（スワイプ後に出現） */}
      <div className="absolute inset-y-0 right-0 flex items-stretch">
        {QUICK.map(q => (
          <button
            key={q.status}
            type="button"
            title={COMPANY_STATUS_LABELS[q.status]}
            onClick={() => { onStatusChange(company.id, q.status); close(); }}
            className={`${q.cls} text-white text-[10px] font-bold w-9 flex items-center justify-center`}
          >
            {q.label}
          </button>
        ))}
        <button
          type="button"
          title={`${company.name}を削除`}
          onClick={() => { if (confirm(`「${company.name}」を削除しますか？`)) { onDelete(company.id); } }}
          className="bg-gray-600 text-white text-[10px] font-bold w-9 flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* カード本体（ref で直接 transform を操作） */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Link href={isOpen ? "#" : `/companies/${company.id}`} onClick={isOpen ? (e) => { e.preventDefault(); close(); } : undefined}>
          <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="font-semibold text-gray-900 leading-tight truncate">{company.name}</h3>
                {company.mypage_url && (
                  <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                )}
              </div>
              <StatusBadge
                status={company.status}
                label={company.status === "OFFERED" ? (company.is_intern_offer ? "インターン合格" : "内定") : undefined}
                className="ml-2 shrink-0"
              />
            </div>
            {company.industry && <p className="text-sm text-gray-500 mb-2">{company.industry}</p>}
            {company.notes && <p className="text-sm text-gray-600 line-clamp-2">{company.notes}</p>}
          </div>
        </Link>
      </div>
    </div>
  );
}

// Kanban column definitions
const KANBAN_COLUMNS: { id: string; label: string; statuses: CompanyStatus[]; color: string }[] = [
  { id: "wishlist", label: "気になる", statuses: ["WISHLIST"], color: "bg-gray-400" },
  { id: "applying", label: "応募中", statuses: ["APPLIED", "INTERN_APPLYING"], color: "bg-blue-500" },
  { id: "document", label: "書類選考", statuses: ["DOCUMENT", "INTERN_DOCUMENT"], color: "bg-yellow-500" },
  { id: "interview", label: "面接中", statuses: ["INTERVIEW_1", "INTERVIEW_2", "FINAL", "INTERN_INTERVIEW_1", "INTERN_INTERVIEW_2", "INTERN_FINAL"], color: "bg-purple-500" },
  { id: "result", label: "内定 / 不合格", statuses: ["OFFERED", "INTERN", "REJECTED"], color: "bg-green-500" },
];

function SortableKanbanCard({ company, nextDeadline }: { company: Company; nextDeadline?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: company.id, data: { company } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/companies/${company.id}`}>
        <div className="bg-white rounded-xl border border-gray-100 p-3.5 hover:shadow-md transition-all cursor-pointer group">
          <div className="flex items-start justify-between mb-1.5">
            <h4 className="text-sm font-semibold text-gray-900 leading-tight truncate flex-1">{company.name}</h4>
            <StatusBadge
              status={company.status}
              label={company.status === "OFFERED" ? (company.is_intern_offer ? "インターン合格" : "内定") : undefined}
              className="ml-1.5 shrink-0 text-[10px]"
            />
          </div>
          {company.industry && (
            <p className="text-[11px] text-gray-400 mb-1.5 truncate">{company.industry}</p>
          )}
          {nextDeadline && (
            <div className="flex items-center gap-1 mt-1.5">
              <svg className="w-3 h-3 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] text-orange-500 font-medium">{nextDeadline}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}

function KanbanOverlayCard({ company }: { company: Company }) {
  return (
    <div className="bg-white rounded-xl border-2 border-[#00c896] p-3.5 shadow-xl kanban-card-dragging">
      <div className="flex items-start justify-between mb-1.5">
        <h4 className="text-sm font-semibold text-gray-900 leading-tight truncate flex-1">{company.name}</h4>
        <StatusBadge status={company.status} className="ml-1.5 shrink-0 text-[10px]" />
      </div>
      {company.industry && <p className="text-[11px] text-gray-400 truncate">{company.industry}</p>}
    </div>
  );
}

type ViewMode = "list" | "kanban";

const SUGGEST_CACHE_KEY = "careo_company_suggestions";
const SUGGEST_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface Suggestion {
  name: string;
  industry: string;
  reason: string;
  tag: string;
}

interface IndustryResult {
  portfolio: { industry: string; count: number; companies: string[] }[];
  diversityScore: number;
  dominantIndustry: string;
  risks: string[];
  strengths: string[];
  advice: string;
  blindspot: string;
}

const TAG_STYLES: Record<string, string> = {
  "類似企業": "bg-blue-50 text-blue-700",
  "代替候補": "bg-orange-50 text-orange-700",
  "軸にマッチ": "bg-[#00c896]/10 text-[#00a87e]",
  "成長企業": "bg-purple-50 text-purple-700",
  "穴場": "bg-yellow-50 text-yellow-700",
};

export default function CompaniesPage() {
  const { companies, addCompany, deleteCompany, updateStatus, updateCompany } = useCompanies();
  const { profile } = useProfile();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { showToast } = useToast();
  const router = useRouter();

  const showLimitExceededToast = useCallback((data: { error?: string }) => {
    showToast(
      data.error ?? "今月の無料枠を使い切りました",
      "warning",
      { label: "アップグレード", onClick: () => router.push("/upgrade") },
      10000,
    );
  }, [showToast, router]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("careo_companies_view") as ViewMode) || "list";
    }
    return "list";
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string | "ALL">("ALL");

  // Persist view mode
  useEffect(() => {
    localStorage.setItem("careo_companies_view", viewMode);
  }, [viewMode]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // Next deadline per company
  const companyDeadlines = useMemo(() => {
    const map: Record<string, string> = {};
    companies.forEach(c => {
      const esDeadlines = esList
        .filter(e => e.companyId === c.id && e.deadline && e.status === "DRAFT")
        .map(e => ({ date: e.deadline!, days: daysUntil(e.deadline!) }))
        .filter(d => d.days >= 0);
      const interviewDates = interviews
        .filter(i => i.companyId === c.id && i.result === "PENDING")
        .map(i => ({ date: i.scheduledAt, days: daysUntil(i.scheduledAt) }))
        .filter(d => d.days >= 0);
      const all = [...esDeadlines, ...interviewDates].sort((a, b) => a.days - b.days);
      if (all.length > 0) {
        const d = all[0].days;
        map[c.id] = d === 0 ? "今日" : d === 1 ? "明日" : `${d}日後`;
      }
    });
    return map;
  }, [companies, esList, interviews]);

  // Kanban drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const company = companies.find(c => c.id === active.id);
    if (!company) return;

    // Find which column it was dropped on
    const targetColumn = KANBAN_COLUMNS.find(col => col.id === over.id);
    if (targetColumn) {
      // Map to the first status in that column (or OFFERED for result column)
      const currentColStatuses = KANBAN_COLUMNS.find(col => col.statuses.includes(company.status))?.statuses;
      const targetStatuses = targetColumn.statuses;
      // If already in this column, do nothing
      if (currentColStatuses && targetStatuses.some(s => currentColStatuses.includes(s))) return;
      // Pick the most appropriate target status
      let newStatus = targetStatuses[0];
      if (targetColumn.id === "result") {
        // Default to OFFERED when dropping to result
        newStatus = "OFFERED";
      }
      updateStatus(company.id, newStatus);
      if (newStatus === "OFFERED" || newStatus === "INTERN") {
        void fireConfetti();
      }
    }
  };

  // Industries present in current companies
  const presentIndustries = useMemo(() => {
    const set = new Set(companies.map(c => c.industry).filter(Boolean));
    return Array.from(set).sort();
  }, [companies]);

  // コミュニティ平均登録数
  const [communityAvg, setCommunityAvg] = useState(22); // fallback: 日本就活統計ベース
  useEffect(() => {
    const supabase = createClient();
    void supabase.rpc("get_careo_aggregate_insights").then(({ data }) => {
      const parsed = Array.isArray(data) ? data[0] : data;
      if (parsed?.avg_companies_per_user > 0) setCommunityAvg(Math.round(parsed.avg_companies_per_user as number));
    });
  }, []);

  // AI企業提案
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());

  // 業界分析
  const [industryResult, setIndustryResult] = useState<IndustryResult | null>(null);
  const [industryOpen, setIndustryOpen] = useState(false);
  const [industryLoading, setIndustryLoading] = useState(false);

  const hasRejected = companies.some(c => c.status === "REJECTED");
  // コミュニティ平均の70%未満 or 不採用企業あり
  const showSuggestBanner = companies.length < Math.round(communityAvg * 0.7) || hasRejected;

  // キャッシュから読み込み
  useEffect(() => {
    try {
      const cached = localStorage.getItem(SUGGEST_CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached) as { data: Suggestion[]; ts: number };
        if (Date.now() - ts < SUGGEST_CACHE_TTL) setSuggestions(data);
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
      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        showLimitExceededToast(data);
        return;
      }
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
    localStorage.removeItem(SUGGEST_CACHE_KEY);
  }, [addCompany]);

  // 内定・インターン合格時にconfetti演出
  const fireConfetti = useCallback(async () => {
    const confetti = (await import("canvas-confetti")).default;
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#00c896", "#00b586", "#fff", "#fbbf24"] });
    setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.7 }, colors: ["#00c896", "#a78bfa", "#fb7185"] }), 300);
  }, []);

  // 不採用になった瞬間に自動で提案を開く
  const handleStatusChange = useCallback((id: string, status: CompanyStatus) => {
    updateStatus(id, status);
    if (status === "OFFERED" || status === "INTERN") {
      void fireConfetti();
    }
    if (status === "REJECTED") {
      setSuggestOpen(true);
      // キャッシュがあれば即表示、なければ自動フetch
      try {
        const cached = localStorage.getItem(SUGGEST_CACHE_KEY);
        if (cached) {
          const { data, ts } = JSON.parse(cached) as { data: Suggestion[]; ts: number };
          if (Date.now() - ts < SUGGEST_CACHE_TTL) { setSuggestions(data); return; }
        }
      } catch { /* ignore */ }
      // キャッシュなし → 自動分析（少し遅延させてDBが更新されてから）
      setTimeout(() => {
        void fetchSuggestions();
      }, 500);
    }
  }, [updateStatus, fetchSuggestions]);

  const fetchIndustryAnalysis = useCallback(async () => {
    setIndustryLoading(true);
    setIndustryOpen(true);
    try {
      const res = await fetch("/api/ai/industry-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companies: companies.map(c => ({ name: c.name, industry: c.industry, status: c.status })),
          profile: { careerAxis: profile?.careerAxis, targetIndustries: profile?.targetIndustries },
        }),
      });
      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        showLimitExceededToast(data);
        setIndustryOpen(false);
        return;
      }
      if (!res.ok) return;
      const data = await res.json() as IndustryResult;
      setIndustryResult(data);
    } finally {
      setIndustryLoading(false);
    }
  }, [companies, profile]);

  const handleImportComplete = useCallback((counts: Record<string, number>) => {
    const parts = [];
    if (counts.companies) parts.push(`企業${counts.companies}社`);
    if (counts.obVisits) parts.push(`OB訪問${counts.obVisits}件`);
    if (counts.tests) parts.push(`筆記試験${counts.tests}件`);
    if (counts.interviews) parts.push(`面接${counts.interviews}件`);
    showToast(`${parts.join("・")}をインポートしました`, "success");
    // 企業リストをリフレッシュ
    if (counts.companies) window.location.reload();
  }, [showToast]);

  const filtered = companies
    .filter((c) => filterStatus === "ALL" || c.status === filterStatus)
    .filter((c) => filterIndustry === "ALL" || c.industry === filterIndustry)
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.industry ?? "").toLowerCase().includes(q);
    });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const activeCompany = activeId ? companies.find(c => c.id === activeId) : null;

  return (
    <div className="p-4 md:p-8">
      <PageTutorial {...PAGE_TUTORIALS["companies"]} pageKey="companies" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">企業管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{companies.length}社を管理中</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* View toggle (PC only) */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              リスト
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              カンバン
            </button>
          </div>
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
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#00c896] focus:ring-1 focus:ring-[#00c896]/20"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter chips (Stripe style) */}
      <div className="flex gap-2 flex-wrap mb-4">
        {/* Status filters */}
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filterStatus === "ALL"
              ? "bg-[#00c896] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === s
                  ? "bg-[#00c896] text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {COMPANY_STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* Industry filter chips */}
      {presentIndustries.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-6">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider self-center mr-1">業界</span>
          <button
            onClick={() => setFilterIndustry("ALL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
              filterIndustry === "ALL"
                ? "bg-gray-800 text-white"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            すべて
          </button>
          {presentIndustries.map((ind) => (
            <button
              key={ind}
              onClick={() => setFilterIndustry(ind === filterIndustry ? "ALL" : ind!)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                filterIndustry === ind
                  ? "bg-gray-800 text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      )}

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

          {/* 外部サービスへの誘導（企業提案） */}
          <div className="mt-3 pt-3 border-t border-[#00c896]/20 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-gray-400">スカウト・企業発見:</span>
            <a href="https://offerbox.jp" target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-medium text-[#00a87e] hover:underline">OfferBox →</a>
            <a href="https://www.wantedly.com/explore" target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-medium text-[#00a87e] hover:underline">Wantedly →</a>
            <a href="https://syukatsu-kaigi.jp" target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-medium text-[#00a87e] hover:underline">就活会議 →</a>
          </div>
        </div>
      )}

      {/* 業界分析 */}
      {companies.length >= 3 && (
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0">📊</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">業界分析</p>
                <p className="text-xs text-gray-500 mt-0.5">ポートフォリオの偏り・リスクをAIが診断</p>
              </div>
            </div>
            <button
              type="button"
              onClick={industryOpen ? () => setIndustryOpen(false) : fetchIndustryAnalysis}
              className="shrink-0 text-xs font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              {industryOpen ? "閉じる" : industryResult ? "結果を見る" : "分析する"}
            </button>
          </div>

          {industryOpen && (
            <div className="mt-4">
              {industryLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                  <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  ポートフォリオを分析中...
                </div>
              ) : industryResult ? (
                <div className="space-y-3 mt-2">
                  {/* 多様性スコア */}
                  <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 text-base font-bold border-4 ${industryResult.diversityScore >= 60 ? "border-[#00c896] text-[#00a87e]" : industryResult.diversityScore >= 40 ? "border-orange-400 text-orange-500" : "border-red-400 text-red-500"}`}>
                      {industryResult.diversityScore}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">業界多様性スコア</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {industryResult.diversityScore >= 60 ? "バランスが良い" : industryResult.diversityScore >= 40 ? "やや偏りあり" : "要改善：集中しすぎ"}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">軸: {industryResult.dominantIndustry}</p>
                    </div>
                  </div>

                  {/* 業界分布 */}
                  <div className="bg-white rounded-xl border border-gray-100 p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">業界分布</p>
                    <div className="space-y-1.5">
                      {industryResult.portfolio.slice(0, 5).map(p => (
                        <div key={p.industry} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-700 truncate">{p.industry}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {Array.from({ length: Math.min(p.count, 8) }).map((_, i) => (
                              <span key={i} className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                            ))}
                            <span className="text-xs text-gray-400">{p.count}社</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* リスク・強み */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {industryResult.risks.length > 0 && (
                      <div className="bg-red-50 rounded-xl border border-red-100 p-3">
                        <p className="text-xs font-semibold text-red-700 mb-1.5">⚠ リスク</p>
                        <ul className="space-y-1">
                          {industryResult.risks.map((r, i) => (
                            <li key={i} className="text-xs text-red-600">{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {industryResult.strengths.length > 0 && (
                      <div className="bg-green-50 rounded-xl border border-green-100 p-3">
                        <p className="text-xs font-semibold text-green-700 mb-1.5">✓ 強み</p>
                        <ul className="space-y-1">
                          {industryResult.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-green-700">{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* アドバイス・盲点 */}
                  <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">AIアドバイス</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{industryResult.advice}</p>
                    </div>
                    {industryResult.blindspot && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">見落としかも</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{industryResult.blindspot}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={fetchIndustryAnalysis}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
                  >
                    再分析する →
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* 外部サービスへの誘導（業界分析） */}
          <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-gray-400">より詳しい業界研究:</span>
            <a href="https://job.mynavi.jp/conts/trend/" target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-medium text-blue-600 hover:underline">マイナビ業界研究 →</a>
            <a href="https://job.rikunabi.com/contents/industry/" target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-medium text-blue-600 hover:underline">リクナビ業界研究 →</a>
          </div>
        </div>
      )}

      {/* 企業一覧 / カンバンビュー */}
      {sorted.length === 0 && viewMode === "list" ? (
        <div className="text-center py-12">
          <KareoCharacter expression="encouraging" size={100} className="mx-auto mb-3" />
          <p className="text-gray-400 font-medium">企業が登録されていません</p>
          <p className="text-sm text-gray-300 mt-1">まずは気になる企業を追加してみよう!</p>
        </div>
      ) : viewMode === "kanban" ? (
        /* ===== Kanban View ===== */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {KANBAN_COLUMNS.map((col) => {
              const colCompanies = filtered.filter(c => col.statuses.includes(c.status));
              return (
                <div
                  key={col.id}
                  id={col.id}
                  className="flex-shrink-0 w-[260px] md:w-[240px] md:flex-1"
                >
                  <div className="bg-gray-50/80 rounded-2xl p-3 kanban-column border border-gray-100">
                    {/* Column header */}
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={`w-2 h-2 rounded-full ${col.color}`} />
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">{col.label}</h3>
                      <span className="text-[10px] text-gray-400 font-semibold bg-white px-1.5 py-0.5 rounded-full ml-auto">
                        {colCompanies.length}
                      </span>
                    </div>

                    {/* Cards */}
                    <SortableContext
                      items={colCompanies.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                      id={col.id}
                    >
                      <div className="space-y-2 min-h-[80px]">
                        {colCompanies.map((company) => (
                          <SortableKanbanCard
                            key={company.id}
                            company={company}
                            nextDeadline={companyDeadlines[company.id]}
                          />
                        ))}
                        {colCompanies.length === 0 && (
                          <div className="text-center py-6 text-[11px] text-gray-300 font-medium">
                            ドラッグして移動
                          </div>
                        )}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              );
            })}
          </div>
          <DragOverlay>
            {activeCompany ? <KanbanOverlayCard company={activeCompany} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* ===== List View ===== */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {sorted.map((company) => (
            // Mobile: swipeable card
            <div key={company.id} className="md:hidden">
              <SwipeableCompanyCard
                company={company}
                onDelete={deleteCompany}
                onStatusChange={handleStatusChange}
              />
            </div>
          ))}
          {sorted.map((company) => (
            // PC: hover with quick actions
            <Link key={`pc-${company.id}`} href={`/companies/${company.id}`} className="hidden md:block group">
              <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer relative">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="font-semibold text-gray-900 leading-tight truncate">{company.name}</h3>
                    {company.mypage_url && (
                      <span title="マイページあり" className="shrink-0">
                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <StatusBadge
                    status={company.status}
                    label={company.status === "OFFERED" ? (company.is_intern_offer ? "インターン合格" : "内定") : undefined}
                    className="ml-2 shrink-0"
                  />
                </div>
                {company.industry && <p className="text-sm text-gray-500 mb-2">{company.industry}</p>}
                {company.notes && <p className="text-sm text-gray-600 line-clamp-2">{company.notes}</p>}
                {companyDeadlines[company.id] && (
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50">
                    <svg className="w-3 h-3 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[11px] text-orange-500 font-medium">次の予定: {companyDeadlines[company.id]}</span>
                  </div>
                )}
                {company.mypage_url && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <a
                      href={company.mypage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-blue-500 hover:text-blue-700 font-medium hover:underline"
                    >
                      マイページを開く →
                    </a>
                  </div>
                )}
                {/* Hover quick actions */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteCompany(company.id); }}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors"
                    title="削除"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="企業を追加">
        <CompanyForm
          onSubmit={async (data) => {
            const inserted = await addCompany(data);
            setIsModalOpen(false);
            // バックグラウンドで選考日程を自動取得
            if (inserted) {
              void fetch("/api/ai/selection-schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  companyName: data.name,
                  industry: data.industry,
                  graduationYear: profile?.graduationYear,
                }),
              }).then(async (res) => {
                if (!res.ok) return;
                const schedule = await res.json();
                await updateCompany(inserted.id, { selection_schedule: JSON.stringify(schedule) });
              }).catch(() => { /* 失敗は無視 */ });
            }
          }}
          onCancel={() => setIsModalOpen(false)}
          submitLabel="追加する"
        />
      </Modal>

      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
