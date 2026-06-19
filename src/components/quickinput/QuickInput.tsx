"use client";

import { useState, useRef } from "react";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useObVisits } from "@/hooks/useObVisits";
import { useCustomEvents } from "@/hooks/useCustomEvents";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import {
  Company,
  CompanyStatus,
  AxisLayers,
  FutureVision,
  StrengthWithEvidence,
  JobRolePriority,
} from "@/types";

type ParseAction =
  | { type: "company_update"; companyId?: string; companyName?: string; patch?: Partial<Company> }
  | { type: "company_create"; data?: Partial<Company> & { name: string } }
  | { type: "interview_create"; companyId?: string; companyName?: string; data?: { round?: number; scheduledAt?: string; purpose?: string; interviewers?: string; notes?: string } }
  | { type: "es_create"; companyId?: string; companyName?: string; data?: { title?: string; deadline?: string } }
  | { type: "ob_visit_create"; data?: { companyName?: string; personName?: string; visitedAt?: string; insights?: string; purpose?: "ob_visit" | "info_session" | "internship" } }
  | { type: "event_create"; data?: { title?: string; scheduledAt?: string; location?: string; notes?: string } }
  | { type: "identity_patch"; patch?: { careerAxis?: string; gakuchika?: string; selfPr?: string; strengths?: string; weaknesses?: string; axisLayers?: AxisLayers; vision5y?: FutureVision; vision10y?: FutureVision; strengthsWithEvidence?: StrengthWithEvidence[]; jobRolePriorities?: JobRolePriority[] } };

type ParseResult = {
  intent: string;
  actions: ParseAction[];
  summary?: string;
  next_actions?: string[];
  pdca_insight?: string;
};

type Props = {
  /** "auto" / "identity" 等。デフォルト auto */
  mode?: "auto" | "identity" | "company" | "interview";
  /** プレースホルダ */
  placeholder?: string;
  /** ヘッダコピー */
  title?: string;
  desc?: string;
  /** 入力欄の追加クラス */
  className?: string;
};

export function QuickInput({
  mode = "auto",
  placeholder,
  title = "🪄 ひとことで記録",
  desc = "「サイバーの二次面接、6/20 14時に決まった」みたいに話せば、AIが整理してデータに保存します。",
  className = "",
}: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const { companies, addCompany, updateCompany } = useCompanies();
  const { addEs } = useEs();
  const { addInterview } = useInterviews();
  const { addVisit } = useObVisits();
  const { addCustomEvent } = useCustomEvents();
  const { profile, patchSelfAnalysis, patchIdentity } = useProfile();
  const { showToast } = useToast();

  // 入力欄の自動拡張
  const handleInput = () => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = `${Math.min(taRef.current.scrollHeight, 240)}px`;
  };

  const resolveCompany = (companyId?: string, name?: string): Company | undefined => {
    if (companyId) {
      const c = companies.find((x) => x.id === companyId);
      if (c) return c;
    }
    if (name) {
      const lower = name.toLowerCase();
      return companies.find((c) =>
        c.name.toLowerCase() === lower ||
        c.name.toLowerCase().includes(lower) ||
        lower.includes(c.name.toLowerCase())
      );
    }
    return undefined;
  };

  const submit = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/parse-input", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mode,
          companies: companies.slice(0, 50).map((c) => ({
            id: c.id,
            name: c.name,
            industry: c.industry,
            status: c.status,
            deadline: c.deadline,
          })),
          identity: profile ? {
            careerAxis: profile.careerAxis,
            gakuchika: profile.gakuchika,
            strengths: profile.strengths,
            axisLayers: profile.axisLayers,
            vision5y: profile.vision5y,
            vision10y: profile.vision10y,
          } : undefined,
        }),
      });
      if (res.status === 402) {
        const body = await res.json();
        showToast(body.error ?? "AI入力解析の上限に達しました", "error");
        return;
      }
      if (!res.ok) {
        showToast("解析に失敗しました", "error");
        return;
      }
      const data: ParseResult = await res.json();

      // actions を順次実行
      let success = 0;
      let failed = 0;
      for (const a of data.actions ?? []) {
        try {
          await executeAction(a);
          success++;
        } catch (e) {
          console.error("[QuickInput] action failed", a, e);
          failed++;
        }
      }

      setResult(data);
      if (success > 0) {
        showToast(`${success}件 保存しました${failed > 0 ? `（${failed}件失敗）` : ""}`, "success");
        setText("");
        if (taRef.current) taRef.current.style.height = "auto";
      } else if (data.actions?.length === 0) {
        showToast("入力からデータが特定できませんでした", "warning");
      }
    } catch {
      showToast("ネットワークエラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (a: ParseAction) => {
    switch (a.type) {
      case "company_update": {
        const c = resolveCompany(a.companyId, a.companyName);
        if (!c || !a.patch) throw new Error("company not found");
        await updateCompany(c.id, a.patch);
        return;
      }
      case "company_create": {
        if (!a.data?.name) throw new Error("name required");
        const status = (a.data.status as CompanyStatus) ?? "WISHLIST";
        await addCompany({
          name: a.data.name,
          industry: a.data.industry ?? "",
          url: a.data.url,
          status,
          notes: a.data.notes,
          deadline: a.data.deadline,
          tagline: a.data.tagline,
          positioning: a.data.positioning,
        } as Omit<Company, "id" | "createdAt" | "updatedAt">);
        return;
      }
      case "interview_create": {
        const c = resolveCompany(a.companyId, a.companyName);
        if (!c) throw new Error("company not found");
        await addInterview({
          companyId: c.id,
          round: a.data?.round ?? 1,
          scheduledAt: a.data?.scheduledAt ?? new Date().toISOString(),
          interviewers: a.data?.interviewers,
          questions: [],
          notes: a.data?.notes ?? a.data?.purpose,
          result: "PENDING",
        });
        return;
      }
      case "es_create": {
        const c = resolveCompany(a.companyId, a.companyName);
        if (!c) throw new Error("company not found");
        await addEs({
          companyId: c.id,
          title: a.data?.title ?? "ES",
          questions: [],
          deadline: a.data?.deadline,
          status: "DRAFT",
          result: "pending",
          isSharedAnonymously: false,
        });
        return;
      }
      case "ob_visit_create": {
        if (!a.data?.companyName || !a.data.visitedAt) throw new Error("ob_visit fields missing");
        const c = resolveCompany(undefined, a.data.companyName);
        await addVisit({
          companyName: a.data.companyName,
          companyId: c?.id,
          personName: a.data.personName,
          visitedAt: a.data.visitedAt,
          purpose: a.data.purpose ?? "ob_visit",
          insights: a.data.insights,
        });
        return;
      }
      case "event_create": {
        if (!a.data?.title || !a.data?.scheduledAt) throw new Error("event fields missing");
        await addCustomEvent({
          title: a.data.title,
          scheduledAt: a.data.scheduledAt,
          location: a.data.location,
          notes: a.data.notes,
          color: "blue",
        });
        return;
      }
      case "identity_patch": {
        if (!a.patch) throw new Error("identity patch missing");
        // 自己分析（テキスト）と構造化Identity を分けて適用
        const sa: Parameters<typeof patchSelfAnalysis>[0] = {};
        if (a.patch.careerAxis !== undefined) sa.careerAxis = a.patch.careerAxis;
        if (a.patch.gakuchika !== undefined) sa.gakuchika = a.patch.gakuchika;
        if (a.patch.selfPr !== undefined) sa.selfPr = a.patch.selfPr;
        if (a.patch.strengths !== undefined) sa.strengths = a.patch.strengths;
        if (a.patch.weaknesses !== undefined) sa.weaknesses = a.patch.weaknesses;
        if (Object.keys(sa).length > 0) await patchSelfAnalysis(sa);
        const id: Parameters<typeof patchIdentity>[0] = {};
        if (a.patch.axisLayers !== undefined) id.axisLayers = a.patch.axisLayers;
        if (a.patch.vision5y !== undefined) id.vision5y = a.patch.vision5y;
        if (a.patch.vision10y !== undefined) id.vision10y = a.patch.vision10y;
        if (a.patch.strengthsWithEvidence !== undefined) id.strengthsWithEvidence = a.patch.strengthsWithEvidence;
        if (a.patch.jobRolePriorities !== undefined) id.jobRolePriorities = a.patch.jobRolePriorities;
        if (Object.keys(id).length > 0) await patchIdentity(id);
        return;
      }
    }
  };

  const examples = mode === "identity"
    ? [
        "軸の最深層は『期待を背負うと火がつくこと』",
        "ガクチカ追加：113名のサークル新歓を企画して動員過去最多にした",
        "強み：信頼を背負う力。エピソードはサークル幹部・センターバック",
      ]
    : [
        "サイバーの二次面接、6/20 14時に決まった",
        "リクルートが気になる企業に追加",
        "ベイカレ ES通過した",
      ];

  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-5 ${className}`}>
      <div className="mb-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-gray-500 mt-1">{desc}</p>
      </div>

      <div className="relative">
        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => { setText(e.target.value); handleInput(); }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          rows={2}
          placeholder={placeholder ?? "例: サイバーの二次面接、6/20 14時に決まった"}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex flex-wrap gap-1.5">
            {examples.slice(0, 2).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => { setText(ex); setTimeout(handleInput, 0); }}
                className="text-[11px] text-gray-500 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 px-2 py-1 rounded-md"
              >
                💡 {ex}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !text.trim()}
            className="shrink-0 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-medium rounded-lg whitespace-nowrap"
          >
            {loading ? "解析中…" : "保存"}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">Cmd/Ctrl + Enter で送信</p>
      </div>

      {result && (
        <div className="mt-4 space-y-3">
          {result.summary && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-900">
              ✓ {result.summary}
            </div>
          )}
          {result.next_actions && result.next_actions.length > 0 && (
            <div className="rounded-lg bg-white border border-emerald-100 px-3 py-2.5">
              <div className="text-[10px] font-bold tracking-wider text-emerald-700 mb-1.5">
                🎯 次の一手
              </div>
              <ul className="space-y-1">
                {result.next_actions.map((n, i) => (
                  <li key={i} className="text-xs text-gray-800 leading-relaxed">
                    ・{n}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.pdca_insight && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5">
              <div className="text-[10px] font-bold tracking-wider text-indigo-700 mb-1">
                💡 PDCA インサイト
              </div>
              <p className="text-xs text-indigo-900 leading-relaxed">{result.pdca_insight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
