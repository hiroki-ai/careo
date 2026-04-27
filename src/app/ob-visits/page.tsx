"use client";

import { useState } from "react";
import { useObVisits } from "@/hooks/useObVisits";
import { useCompanies } from "@/hooks/useCompanies";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ObVisit, OB_VISIT_PURPOSE_LABELS, OB_IMPRESSION_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";
import { KareoCharacter } from "@/components/kareo/KareoCharacter";
import { PageTutorial, PAGE_TUTORIALS } from "@/components/PageTutorial";
import { DateTimeField } from "@/components/forms/DateTimeField";
import { AutoTextarea } from "@/components/forms/AutoTextarea";
import { SegmentedChoice } from "@/components/forms/SegmentedChoice";
import { CompanyCombobox } from "@/components/forms/CompanyCombobox";

const IMPRESSION_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  neutral: "bg-gray-100 text-gray-600",
  negative: "bg-red-100 text-red-600",
};

const defaultForm = (): Omit<ObVisit, "id" | "createdAt" | "updatedAt"> => ({
  companyName: "",
  visitedAt: new Date().toISOString().split("T")[0],
  purpose: "ob_visit",
  personName: "",
  insights: "",
  impression: undefined,
  notes: "",
});

export default function ObVisitsPage() {
  const { visits, loading, addVisit, deleteVisit } = useObVisits();
  const { companies } = useCompanies();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<ObVisit | null>(null);

  const handleSubmit = async () => {
    if (!form.companyName.trim() || !form.visitedAt) {
      showToast("企業名と日付は必須です", "warning");
      return;
    }
    setSaving(true);
    const matchedCompany = companies.find(c => c.name === form.companyName);
    const ok = await addVisit({ ...form, companyId: matchedCompany?.id });
    if (ok) {
      showToast("追加しました", "success");
      setIsOpen(false);
      setForm(defaultForm());
    } else {
      showToast("追加に失敗しました。Supabaseのテーブルを確認してください。", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    await deleteVisit(id);
    showToast(`「${name}」の記録を削除しました`, "warning");
    setDetail(null);
  };

  return (
    <div className="p-4 md:p-8">
      <PageTutorial {...PAGE_TUTORIALS["ob-visits"]} pageKey="ob-visits" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OB/OG訪問ログ</h1>
          <p className="text-sm text-gray-500 mt-1">{visits.length}件の記録</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>+ 追加</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : visits.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <KareoCharacter expression="encouraging" size={100} className="mx-auto mb-3" />
          <p className="font-medium mb-1">OB/OG訪問の記録がありません</p>
          <p className="text-sm">訪問後の気づき・印象・情報をメモしておきましょう</p>
          <Button className="mt-4" onClick={() => setIsOpen(true)}>最初の記録を追加</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <div
              key={v.id}
              onClick={() => setDetail(v)}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{v.companyName}</h3>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      {OB_VISIT_PURPOSE_LABELS[v.purpose]}
                    </span>
                    {v.impression && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${IMPRESSION_COLORS[v.impression]}`}>
                        {OB_IMPRESSION_LABELS[v.impression]}
                      </span>
                    )}
                  </div>
                  {v.personName && <p className="text-sm text-gray-500 mt-0.5">{v.personName}</p>}
                  {v.insights && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{v.insights}</p>}
                </div>
                <span className="text-xs text-gray-400 shrink-0 ml-3">{formatDate(v.visitedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 追加モーダル */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="OB/OG訪問を記録">
        <div className="space-y-4">
          <CompanyCombobox
            label="企業名"
            required
            value={form.companyName}
            onChange={(name) => setForm({ ...form, companyName: name })}
            options={companies.map(c => ({ id: c.id, name: c.name }))}
          />

          <DateTimeField
            label="日付"
            required
            withTime={false}
            value={form.visitedAt}
            onChange={(iso) => setForm({ ...form, visitedAt: iso ? iso.split("T")[0] : "" })}
          />

          <SegmentedChoice
            label="種別"
            value={form.purpose}
            onChange={(v) => setForm({ ...form, purpose: v })}
            options={[
              { value: "ob_visit", label: "OB/OG訪問", emoji: "🤝" },
              { value: "info_session", label: "会社説明会", emoji: "📊" },
              { value: "internship", label: "インターン", emoji: "💼" },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">担当者名（任意）</label>
            <input
              value={form.personName ?? ""}
              onChange={(e) => setForm({ ...form, personName: e.target.value })}
              className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
              placeholder="例: 田中さん（人事）"
            />
          </div>

          <SegmentedChoice
            label="印象"
            value={form.impression}
            onChange={(v) => setForm({ ...form, impression: v })}
            options={[
              { value: "positive", label: "好印象", emoji: "😊" },
              { value: "neutral", label: "普通", emoji: "😐" },
              { value: "negative", label: "懸念", emoji: "🤔" },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">得た情報・気づき</label>
            <AutoTextarea
              value={form.insights ?? ""}
              onChange={(v) => setForm({ ...form, insights: v })}
              minRows={3}
              placeholder="社風、仕事内容、キャリアパスなど聞いた情報"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">メモ</label>
            <AutoTextarea
              value={form.notes ?? ""}
              onChange={(v) => setForm({ ...form, notes: v })}
              minRows={2}
              placeholder="次回のアクションや感想など"
            />
          </div>

          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-1">
            <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">キャンセル</Button>
            <Button onClick={handleSubmit} disabled={saving} className="flex-1">
              {saving ? "保存中..." : "保存する"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 詳細モーダル */}
      {detail && (
        <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail.companyName}>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2 flex-wrap">
              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs">{OB_VISIT_PURPOSE_LABELS[detail.purpose]}</span>
              <span className="text-gray-500">{formatDate(detail.visitedAt)}</span>
              {detail.impression && (
                <span className={`px-2 py-1 rounded-full text-xs ${IMPRESSION_COLORS[detail.impression]}`}>
                  {OB_IMPRESSION_LABELS[detail.impression]}
                </span>
              )}
            </div>
            {detail.personName && <p className="text-gray-600">担当者: {detail.personName}</p>}
            {detail.insights && (
              <div>
                <p className="font-medium text-gray-700 mb-1">得た情報・気づき</p>
                <p className="text-gray-600 whitespace-pre-wrap">{detail.insights}</p>
              </div>
            )}
            {detail.notes && (
              <div>
                <p className="font-medium text-gray-700 mb-1">メモ</p>
                <p className="text-gray-600 whitespace-pre-wrap">{detail.notes}</p>
              </div>
            )}
            <Button variant="destructive" size="sm" onClick={() => handleDelete(detail.id, detail.companyName)}>
              削除
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
