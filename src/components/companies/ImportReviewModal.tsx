"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CompanyStatus, COMPANY_STATUS_LABELS } from "@/types";

// ─── 型定義 ──────────────────────────────────────────────────────────────────

export interface ImportCompany {
  name: string;
  industry: string;
  status: CompanyStatus;
  notes: string;
  url?: string;
  mypage_url?: string;
}

export interface ImportObVisit {
  companyName: string;
  purpose: "ob_visit" | "info_session" | "internship";
  visitedAt: string;
  personName: string;
  insights: string;
  impression: "positive" | "neutral" | "negative";
}

export interface ImportTest {
  companyName: string;
  testType: "SPI" | "TG-WEB" | "玉手箱" | "CAB" | "GAB" | "SCOA" | "その他";
  testDate: string;
  result: "PASS" | "FAIL" | "PENDING";
  notes: string;
}

export interface ImportInterview {
  companyName: string;
  round: number;
  scheduledAt: string;
  result: "PASS" | "FAIL" | "PENDING";
  notes: string;
}

export interface ImportData {
  companies: ImportCompany[];
  obVisits: ImportObVisit[];
  tests: ImportTest[];
  interviews: ImportInterview[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: ImportData;
  onComplete: (counts: Record<string, number>) => void;
}

// ─── ユーティリティ ───────────────────────────────────────────────────────────

const PURPOSE_LABELS = { ob_visit: "OB/OG訪問", info_session: "会社説明会", internship: "インターン" };
const IMPRESSION_LABELS = { positive: "好印象", neutral: "普通", negative: "懸念あり" };
const TEST_TYPES = ["SPI", "TG-WEB", "玉手箱", "CAB", "GAB", "SCOA", "その他"] as const;

// ─── 行コンポーネント群 ───────────────────────────────────────────────────────

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="shrink-0 text-gray-300 hover:text-red-400 transition-colors p-1"
      title="削除">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

function FieldInput({ value, onChange, placeholder, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white ${className}`}
    />
  );
}

// ─── メインコンポーネント ─────────────────────────────────────────────────────

type TabKey = "companies" | "obVisits" | "tests" | "interviews";

export function ImportReviewModal({ isOpen, onClose, data: initialData, onComplete }: Props) {
  const [companies, setCompanies] = useState<ImportCompany[]>(initialData.companies);
  const [obVisits, setObVisits] = useState<ImportObVisit[]>(initialData.obVisits);
  const [tests, setTests] = useState<ImportTest[]>(initialData.tests);
  const [interviews, setInterviews] = useState<ImportInterview[]>(initialData.interviews);
  const [activeTab, setActiveTab] = useState<TabKey>("companies");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allTabs: { key: TabKey; label: string; count: number }[] = [
    { key: "companies", label: "企業", count: companies.length },
    { key: "obVisits", label: "OB訪問・説明会", count: obVisits.length },
    { key: "tests", label: "筆記試験", count: tests.length },
    { key: "interviews", label: "面接", count: interviews.length },
  ];
  const tabs = allTabs.filter(t => t.count > 0 || t.key === "companies");

  const totalCount = companies.length + obVisits.length + tests.length + interviews.length;

  // ─ 企業編集 ─
  const updateCompany = (i: number, patch: Partial<ImportCompany>) =>
    setCompanies(prev => prev.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const deleteCompany = (i: number) => setCompanies(prev => prev.filter((_, idx) => idx !== i));
  const addCompany = () => setCompanies(prev => [...prev, { name: "", industry: "", status: "WISHLIST", notes: "" }]);

  // ─ OB訪問編集 ─
  const updateObVisit = (i: number, patch: Partial<ImportObVisit>) =>
    setObVisits(prev => prev.map((v, idx) => idx === i ? { ...v, ...patch } : v));
  const deleteObVisit = (i: number) => setObVisits(prev => prev.filter((_, idx) => idx !== i));
  const addObVisit = () => setObVisits(prev => [...prev, { companyName: "", purpose: "ob_visit", visitedAt: "", personName: "", insights: "", impression: "neutral" }]);

  // ─ 筆記試験編集 ─
  const updateTest = (i: number, patch: Partial<ImportTest>) =>
    setTests(prev => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  const deleteTest = (i: number) => setTests(prev => prev.filter((_, idx) => idx !== i));
  const addTest = () => setTests(prev => [...prev, { companyName: "", testType: "SPI", testDate: "", result: "PENDING", notes: "" }]);

  // ─ 面接編集 ─
  const updateInterview = (i: number, patch: Partial<ImportInterview>) =>
    setInterviews(prev => prev.map((v, idx) => idx === i ? { ...v, ...patch } : v));
  const deleteInterview = (i: number) => setInterviews(prev => prev.filter((_, idx) => idx !== i));
  const addInterview = () => setInterviews(prev => [...prev, { companyName: "", round: 1, scheduledAt: "", result: "PENDING", notes: "" }]);

  // ─ 一括保存 ─
  const handleSave = useCallback(async () => {
    const validCompanies = companies.filter(c => c.name.trim());
    if (!validCompanies.length && !obVisits.length && !tests.length && !interviews.length) {
      setError("少なくとも1件のデータが必要です");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. 企業を一括INSERT → name→id マップを作成
      const nameToId: Record<string, string> = {};
      if (validCompanies.length) {
        const { data: inserted } = await supabase
          .from("companies")
          .insert(validCompanies.map(c => ({ name: c.name, industry: c.industry, status: c.status, notes: c.notes || null, url: c.url || null, mypage_url: c.mypage_url || null, user_id: user.id })))
          .select("id, name");
        if (inserted) {
          (inserted as { id: string; name: string }[]).forEach(r => { nameToId[r.name] = r.id; });
        }
      }

      // 2. OB訪問
      const validObVisits = obVisits.filter(v => v.companyName.trim());
      if (validObVisits.length) {
        await supabase.from("ob_visits").insert(
          validObVisits.map(v => ({
            company_name: v.companyName,
            company_id: nameToId[v.companyName] ?? null,
            purpose: v.purpose,
            visited_at: v.visitedAt || new Date().toISOString().split("T")[0],
            person_name: v.personName || null,
            insights: v.insights || null,
            impression: v.impression,
            user_id: user.id,
          }))
        );
      }

      // 3. 筆記試験
      const validTests = tests.filter(t => t.companyName.trim());
      if (validTests.length) {
        await supabase.from("aptitude_tests").insert(
          validTests.map(t => ({
            company_name: t.companyName,
            company_id: nameToId[t.companyName] ?? null,
            test_type: t.testType,
            test_date: t.testDate || null,
            result: t.result,
            notes: t.notes || null,
            user_id: user.id,
          }))
        );
      }

      // 4. 面接
      const validInterviews = interviews.filter(v => v.companyName.trim());
      if (validInterviews.length) {
        const { data: insertedInterviews } = await supabase
          .from("interviews")
          .insert(validInterviews.map(v => ({
            company_id: nameToId[v.companyName] ?? null,
            round: v.round,
            scheduled_at: v.scheduledAt || new Date().toISOString(),
            result: v.result,
            notes: v.notes || null,
            user_id: user.id,
          })))
          .select("id");
        // 面接質問は空で作成（interview_questions テーブル）
        if (insertedInterviews) {
          const qRows = (insertedInterviews as { id: string }[]).map(r => ({ interview_id: r.id, question: "", answer: "", order_index: 0, user_id: user.id }));
          if (qRows.length) await supabase.from("interview_questions").insert(qRows);
        }
      }

      onComplete({
        companies: validCompanies.length,
        obVisits: validObVisits.length,
        tests: validTests.length,
        interviews: validInterviews.length,
      });
    } catch (e) {
      console.error("[ImportReviewModal] save error", e);
      setError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }, [companies, obVisits, tests, interviews, onComplete]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="インポート内容の確認・編集">
      <div className="space-y-4">

        {/* タブ */}
        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === t.key ? "bg-[#00c896] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {t.label} {t.count > 0 && <span className="ml-1 opacity-80">({t.count})</span>}
            </button>
          ))}
        </div>

        {/* ── 企業タブ ── */}
        {activeTab === "companies" && (
          <div className="space-y-2">
            {companies.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">企業が抽出されませんでした</p>
            )}
            {companies.map((c, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FieldInput value={c.name} onChange={v => updateCompany(i, { name: v })} placeholder="企業名 *" className="flex-1 font-semibold" />
                  <DeleteBtn onClick={() => deleteCompany(i)} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <FieldInput value={c.industry} onChange={v => updateCompany(i, { industry: v })} placeholder="業界" className="w-28" />
                  <select
                    value={c.status}
                    onChange={e => updateCompany(i, { status: e.target.value as CompanyStatus })}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white"
                  >
                    {Object.entries(COMPANY_STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <FieldInput value={c.notes} onChange={v => updateCompany(i, { notes: v })} placeholder="メモ（締切・備考）" className="w-full" />
              </div>
            ))}
            <button type="button" onClick={addCompany}
              className="w-full text-xs text-[#00c896] font-semibold border border-dashed border-[#00c896]/40 rounded-xl py-2 hover:bg-[#00c896]/5 transition-colors">
              + 企業を追加
            </button>
          </div>
        )}

        {/* ── OB訪問タブ ── */}
        {activeTab === "obVisits" && (
          <div className="space-y-2">
            {obVisits.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">OB訪問・説明会の記録が抽出されませんでした</p>
            )}
            {obVisits.map((v, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FieldInput value={v.companyName} onChange={val => updateObVisit(i, { companyName: val })} placeholder="企業名 *" className="flex-1 font-semibold" />
                  <DeleteBtn onClick={() => deleteObVisit(i)} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select value={v.purpose} onChange={e => updateObVisit(i, { purpose: e.target.value as ImportObVisit["purpose"] })}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white">
                    {Object.entries(PURPOSE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                  <FieldInput value={v.visitedAt} onChange={val => updateObVisit(i, { visitedAt: val })} placeholder="日付 (YYYY-MM-DD)" className="w-36" />
                  <select value={v.impression} onChange={e => updateObVisit(i, { impression: e.target.value as ImportObVisit["impression"] })}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white">
                    {Object.entries(IMPRESSION_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <FieldInput value={v.personName} onChange={val => updateObVisit(i, { personName: val })} placeholder="訪問した人の名前" className="w-full" />
                <textarea value={v.insights} onChange={e => updateObVisit(i, { insights: e.target.value })}
                  placeholder="気づき・メモ"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white resize-none" />
              </div>
            ))}
            <button type="button" onClick={addObVisit}
              className="w-full text-xs text-[#00c896] font-semibold border border-dashed border-[#00c896]/40 rounded-xl py-2 hover:bg-[#00c896]/5 transition-colors">
              + OB訪問・説明会を追加
            </button>
          </div>
        )}

        {/* ── 筆記試験タブ ── */}
        {activeTab === "tests" && (
          <div className="space-y-2">
            {tests.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">筆記試験の記録が抽出されませんでした</p>
            )}
            {tests.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FieldInput value={t.companyName} onChange={val => updateTest(i, { companyName: val })} placeholder="企業名 *" className="flex-1 font-semibold" />
                  <DeleteBtn onClick={() => deleteTest(i)} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select value={t.testType} onChange={e => updateTest(i, { testType: e.target.value as ImportTest["testType"] })}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white">
                    {TEST_TYPES.map(tt => <option key={tt} value={tt}>{tt}</option>)}
                  </select>
                  <FieldInput value={t.testDate} onChange={val => updateTest(i, { testDate: val })} placeholder="日付 (YYYY-MM-DD)" className="w-36" />
                  <select value={t.result} onChange={e => updateTest(i, { result: e.target.value as ImportTest["result"] })}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white">
                    <option value="PENDING">未確定</option>
                    <option value="PASS">通過</option>
                    <option value="FAIL">不通過</option>
                  </select>
                </div>
                <FieldInput value={t.notes} onChange={val => updateTest(i, { notes: val })} placeholder="メモ" className="w-full" />
              </div>
            ))}
            <button type="button" onClick={addTest}
              className="w-full text-xs text-[#00c896] font-semibold border border-dashed border-[#00c896]/40 rounded-xl py-2 hover:bg-[#00c896]/5 transition-colors">
              + 筆記試験を追加
            </button>
          </div>
        )}

        {/* ── 面接タブ ── */}
        {activeTab === "interviews" && (
          <div className="space-y-2">
            {interviews.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">面接の記録が抽出されませんでした</p>
            )}
            {interviews.map((v, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <FieldInput value={v.companyName} onChange={val => updateInterview(i, { companyName: val })} placeholder="企業名 *" className="flex-1 font-semibold" />
                  <DeleteBtn onClick={() => deleteInterview(i)} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select value={v.round} onChange={e => updateInterview(i, { round: Number(e.target.value) })}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white">
                    {[1, 2, 3, 4].map(r => <option key={r} value={r}>{r}次面接</option>)}
                    <option value={99}>最終面接</option>
                  </select>
                  <FieldInput value={v.scheduledAt} onChange={val => updateInterview(i, { scheduledAt: val })} placeholder="日付 (YYYY-MM-DD)" className="w-36" />
                  <select value={v.result} onChange={e => updateInterview(i, { result: e.target.value as ImportInterview["result"] })}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white">
                    <option value="PENDING">未確定</option>
                    <option value="PASS">通過</option>
                    <option value="FAIL">不通過</option>
                  </select>
                </div>
                <textarea value={v.notes} onChange={e => updateInterview(i, { notes: e.target.value })}
                  placeholder="質問・フィードバックのメモ"
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00c896] bg-white resize-none" />
              </div>
            ))}
            <button type="button" onClick={addInterview}
              className="w-full text-xs text-[#00c896] font-semibold border border-dashed border-[#00c896]/40 rounded-xl py-2 hover:bg-[#00c896]/5 transition-colors">
              + 面接を追加
            </button>
          </div>
        )}

        {/* サマリー & 保存 */}
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            計{totalCount}件をCareoに保存
            {companies.length > 0 && `（企業${companies.length}`}
            {obVisits.length > 0 && `・OB${obVisits.length}`}
            {tests.length > 0 && `・筆記${tests.length}`}
            {interviews.length > 0 && `・面接${interviews.length}`}
            {companies.length > 0 && "）"}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>戻る</Button>
            <Button onClick={handleSave} disabled={saving || totalCount === 0}>
              {saving ? "保存中..." : "Careoに保存する"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
