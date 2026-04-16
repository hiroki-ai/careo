"use client";

import { useState } from "react";
import { useCompanies } from "@/hooks/useCompanies";
import { useInterviews } from "@/hooks/useInterviews";
import { useObVisits } from "@/hooks/useObVisits";
import { useEs } from "@/hooks/useEs";
import { useEvents } from "@/hooks/useEvents";
import { useToast } from "@/components/ui/Toast";
import { CompanyEventType, COMPANY_EVENT_TYPES } from "@/types";

type Tab = "company" | "interview" | "ob" | "es" | "event";

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: "company", label: "企業", emoji: "🏢" },
  { id: "interview", label: "面接", emoji: "👥" },
  { id: "ob", label: "OB訪問", emoji: "🤝" },
  { id: "es", label: "ES", emoji: "📄" },
  { id: "event", label: "説明会", emoji: "📅" },
];

const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#00c896] focus:ring-1 focus:ring-[#00c896]/30 bg-white";
const LABEL = "block text-xs font-medium text-gray-500 mb-1";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddModal({ isOpen, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("company");
  const [saving, setSaving] = useState(false);
  const { companies, addCompany } = useCompanies();
  const { addInterview } = useInterviews();
  const { addVisit } = useObVisits();
  const { addEs } = useEs();
  const { addEvent } = useEvents();
  const { showToast } = useToast();

  // company
  const [coName, setCoName] = useState("");
  // interview
  const [ivCo, setIvCo] = useState("");
  const [ivDate, setIvDate] = useState(new Date().toISOString().slice(0, 10));
  const [ivRound, setIvRound] = useState(1);
  const [ivResult, setIvResult] = useState<"PENDING" | "PASS" | "FAIL">("PENDING");
  // ob visit
  const [obCo, setObCo] = useState("");
  const [obDate, setObDate] = useState(new Date().toISOString().slice(0, 10));
  const [obNotes, setObNotes] = useState("");
  // es
  const [esCo, setEsCo] = useState("");
  const [esDeadline, setEsDeadline] = useState("");
  // event (説明会・インターン)
  const [evCoName, setEvCoName] = useState("");
  const [evCo, setEvCo] = useState("");
  const [evType, setEvType] = useState<CompanyEventType>("説明会");
  const [evDate, setEvDate] = useState(new Date().toISOString().slice(0, 16));
  const [evLocation, setEvLocation] = useState("");

  const reset = () => {
    setCoName(""); setIvCo(""); setIvDate(new Date().toISOString().slice(0, 10));
    setIvRound(1); setIvResult("PENDING"); setObCo("");
    setObDate(new Date().toISOString().slice(0, 10)); setObNotes("");
    setEsCo(""); setEsDeadline("");
    setEvCoName(""); setEvCo(""); setEvType("説明会");
    setEvDate(new Date().toISOString().slice(0, 16)); setEvLocation("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === "company") {
        if (!coName.trim()) { showToast("企業名を入力してください", "warning"); return; }
        await addCompany({ name: coName.trim(), status: "WISHLIST", industry: "" });
        showToast(`「${coName.trim()}」を追加しました`, "success");
      } else if (tab === "interview") {
        if (!ivCo) { showToast("企業を選択してください", "warning"); return; }
        await addInterview({ companyId: ivCo, round: ivRound, scheduledAt: ivDate, result: ivResult, questions: [] });
        showToast("面接を記録しました", "success");
      } else if (tab === "ob") {
        if (!obCo.trim()) { showToast("企業名を入力してください", "warning"); return; }
        await addVisit({ companyName: obCo.trim(), visitedAt: obDate, purpose: "ob_visit", notes: obNotes || undefined });
        showToast("OB訪問を記録しました", "success");
      } else if (tab === "es") {
        if (!esCo) { showToast("企業を選択してください", "warning"); return; }
        const name = companies.find(c => c.id === esCo)?.name ?? "";
        await addEs({ companyId: esCo, title: `${name} ES`, deadline: esDeadline || undefined, status: "DRAFT", questions: [], result: "unknown", isSharedAnonymously: false });
        showToast("ESを追加しました", "success");
      } else if (tab === "event") {
        const name = evCoName.trim() || (evCo ? companies.find(c => c.id === evCo)?.name ?? "" : "");
        if (!name) { showToast("企業名を入力してください", "warning"); return; }
        if (!evDate) { showToast("日時を入力してください", "warning"); return; }
        await addEvent({
          companyName: name,
          companyId: evCo || null,
          eventType: evType,
          scheduledAt: new Date(evDate).toISOString(),
          location: evLocation || null,
          endDate: null,
          url: null,
          notes: null,
          status: "upcoming",
        });
        showToast(`${evType}を追加しました`, "success");
      }
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white md:hidden flex flex-col animate-slide-up">
      {/* ヘッダー */}
      <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">クイック記録</h2>
        <button
          type="button"
          title="閉じる"
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* タブ */}
      <div className="shrink-0 flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-[#00c896] text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* フォーム（スクロール可能） */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {tab === "company" && (
          <>
            <div>
              <label className={LABEL}>企業名 *</label>
              <input
                autoFocus
                type="text"
                value={coName}
                onChange={e => setCoName(e.target.value)}
                placeholder="例：トヨタ自動車"
                className={INPUT}
              />
            </div>
            <p className="text-xs text-gray-400">「気になる」ステータスで追加されます</p>
          </>
        )}

        {tab === "interview" && (
          <>
            <div>
              <label className={LABEL}>企業 *</label>
              <select title="企業を選択" value={ivCo} onChange={e => setIvCo(e.target.value)} className={INPUT}>
                <option value="">選択してください</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>日付 *</label>
                <input title="面接日付" type="date" value={ivDate} onChange={e => setIvDate(e.target.value)} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>次数</label>
                <select title="面接次数" value={ivRound} onChange={e => setIvRound(Number(e.target.value))} className={INPUT}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}次</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>結果</label>
              <div className="flex gap-2">
                {([["PENDING", "結果待ち"], ["PASS", "通過"], ["FAIL", "不合格"]] as const).map(([v, lbl]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setIvResult(v)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                      ivResult === v
                        ? v === "PASS" ? "bg-green-500 text-white"
                          : v === "FAIL" ? "bg-red-500 text-white"
                          : "bg-[#00c896] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "ob" && (
          <>
            <div>
              <label className={LABEL}>企業名 *</label>
              <input
                autoFocus
                type="text"
                value={obCo}
                onChange={e => setObCo(e.target.value)}
                placeholder="例：ソニーグループ"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>訪問日</label>
              <input title="訪問日" type="date" value={obDate} onChange={e => setObDate(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>メモ（任意）</label>
              <textarea
                value={obNotes}
                onChange={e => setObNotes(e.target.value)}
                placeholder="気づき・印象など"
                rows={4}
                className={INPUT + " resize-none"}
              />
            </div>
          </>
        )}

        {tab === "es" && (
          <>
            <div>
              <label className={LABEL}>企業 *</label>
              <select title="企業を選択" value={esCo} onChange={e => setEsCo(e.target.value)} className={INPUT}>
                <option value="">選択してください</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>締切日（任意）</label>
              <input title="締切日" type="date" value={esDeadline} onChange={e => setEsDeadline(e.target.value)} className={INPUT} />
            </div>
            <p className="text-xs text-gray-400">詳細な設問はESページから編集できます</p>
          </>
        )}

        {tab === "event" && (
          <>
            {/* 種別 */}
            <div>
              <label className={LABEL}>種別</label>
              <div className="flex flex-wrap gap-2">
                {COMPANY_EVENT_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEvType(t)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                      evType === t
                        ? "bg-[#00c896] text-white border-[#00c896]"
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 企業（登録済みから） */}
            <div>
              <label className={LABEL}>企業（登録済みから）</label>
              <select
                title="企業を選択"
                value={evCo}
                onChange={e => {
                  setEvCo(e.target.value);
                  if (e.target.value) {
                    const co = companies.find(c => c.id === e.target.value);
                    if (co) setEvCoName(co.name);
                  }
                }}
                className={INPUT}
              >
                <option value="">-- 選択しない（手入力）--</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* 企業名 */}
            <div>
              <label className={LABEL}>企業名 *</label>
              <input
                type="text"
                value={evCoName}
                onChange={e => setEvCoName(e.target.value)}
                placeholder="例：株式会社〇〇"
                className={INPUT}
              />
            </div>

            {/* 日時 */}
            <div>
              <label className={LABEL}>日時 *</label>
              <input title="日時" type="datetime-local" value={evDate} onChange={e => setEvDate(e.target.value)} className={INPUT} />
            </div>

            {/* 場所 */}
            <div>
              <label className={LABEL}>場所・形式（任意）</label>
              <input
                type="text"
                value={evLocation}
                onChange={e => setEvLocation(e.target.value)}
                placeholder="例：オンライン / 東京本社"
                className={INPUT}
              />
            </div>
            <p className="text-xs text-gray-400">詳細はスケジュールページから編集できます</p>
          </>
        )}
      </div>

      {/* 保存ボタン（常に画面下部に固定） */}
      <div className="shrink-0 px-5 pt-4 border-t border-gray-100 bg-white quick-add-save-area">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#00c896] hover:bg-[#00a87e] disabled:opacity-60 text-white font-semibold rounded-xl py-3.5 transition-colors"
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}
