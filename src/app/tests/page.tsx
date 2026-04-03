"use client";

import { useState } from "react";
import { useAptitudeTests } from "@/hooks/useAptitudeTests";
import { useCompanies } from "@/hooks/useCompanies";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { AptitudeTest, APTITUDE_TEST_TYPES } from "@/types";
import { formatDate } from "@/lib/utils";

const RESULT_VARIANTS: Record<AptitudeTest["result"], "success" | "danger" | "default"> = {
  PASS: "success", FAIL: "danger", PENDING: "default",
};
const RESULT_LABELS: Record<AptitudeTest["result"], string> = {
  PASS: "通過", FAIL: "不通過", PENDING: "結果待ち",
};

const defaultForm = (): Omit<AptitudeTest, "id" | "createdAt" | "updatedAt"> => ({
  companyName: "",
  testType: "SPI",
  testDate: new Date().toISOString().split("T")[0],
  result: "PENDING",
  scoreVerbal: undefined,
  scoreNonverbal: undefined,
  scoreEnglish: undefined,
  notes: "",
});

export default function TestsPage() {
  const { tests, loading, addTest, deleteTest } = useAptitudeTests();
  const { companies } = useCompanies();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.companyName.trim()) {
      showToast("企業名は必須です", "warning");
      return;
    }
    setSaving(true);
    const matchedCompany = companies.find(c => c.name === form.companyName);
    const ok = await addTest({ ...form, companyId: matchedCompany?.id });
    if (ok) {
      showToast("追加しました", "success");
      setIsOpen(false);
      setForm(defaultForm());
    } else {
      showToast("追加に失敗しました。Supabaseのテーブルを確認してください。", "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteTest(id);
    showToast("削除しました", "warning");
  };

  // 種別ごとの集計
  const byType = APTITUDE_TEST_TYPES.map(type => ({
    type,
    count: tests.filter(t => t.testType === type).length,
    passRate: (() => {
      const typed = tests.filter(t => t.testType === type && t.result !== "PENDING");
      if (typed.length === 0) return null;
      return Math.round(typed.filter(t => t.result === "PASS").length / typed.length * 100);
    })(),
  })).filter(s => s.count > 0);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">筆記試験管理</h1>
          <p className="text-sm text-gray-500 mt-1">{tests.length}件の記録</p>
        </div>
        <div className="flex gap-2">
          <a href="/tests/practice">
            <Button variant="secondary">📝 SPI練習</Button>
          </a>
          <Button onClick={() => setIsOpen(true)}>+ 追加</Button>
        </div>
      </div>

      {/* 種別サマリー */}
      {byType.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {byType.map(s => (
            <div key={s.type} className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-center">
              <p className="text-xs text-gray-500">{s.type}</p>
              <p className="text-lg font-bold text-gray-900">{s.count}件</p>
              {s.passRate !== null && (
                <p className="text-xs text-green-600">通過率 {s.passRate}%</p>
              )}
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📝</p>
          <p className="font-medium mb-1">筆記試験の記録がありません</p>
          <p className="text-sm">SPI・玉手箱・CABなどの受験記録を管理しましょう</p>
          <Button className="mt-4" onClick={() => setIsOpen(true)}>最初の記録を追加</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{t.testType}</span>
                    <h3 className="font-semibold text-gray-900">{t.companyName}</h3>
                    <Badge variant={RESULT_VARIANTS[t.result]}>{RESULT_LABELS[t.result]}</Badge>
                  </div>
                  <div className="flex gap-4 mt-1.5 flex-wrap">
                    {t.testDate && <p className="text-xs text-gray-400">{formatDate(t.testDate)}</p>}
                    {t.scoreVerbal !== undefined && <p className="text-xs text-gray-600">言語: <span className="font-medium">{t.scoreVerbal}</span></p>}
                    {t.scoreNonverbal !== undefined && <p className="text-xs text-gray-600">非言語: <span className="font-medium">{t.scoreNonverbal}</span></p>}
                    {t.scoreEnglish !== undefined && <p className="text-xs text-gray-600">英語: <span className="font-medium">{t.scoreEnglish}</span></p>}
                  </div>
                  {t.notes && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{t.notes}</p>}
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 対策本リンク */}
      <div className="mt-8 border-t border-gray-100 pt-6">
        <p className="text-xs text-gray-400 font-medium mb-3">📚 対策本を探す（Amazon）</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "SPI3対策", url: "https://www.amazon.co.jp/s?k=SPI3+対策&tag=careo-22" },
            { label: "玉手箱対策", url: "https://www.amazon.co.jp/s?k=玉手箱+対策&tag=careo-22" },
            { label: "テストセンター対策", url: "https://www.amazon.co.jp/s?k=テストセンター+SPI+対策&tag=careo-22" },
            { label: "CAB・GAB対策", url: "https://www.amazon.co.jp/s?k=CAB+GAB+対策&tag=careo-22" },
            { label: "数的処理・非言語", url: "https://www.amazon.co.jp/s?k=SPI+非言語+対策&tag=careo-22" },
          ].map(({ label, url }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-full transition-colors"
            >
              {label} →
            </a>
          ))}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="筆記試験を記録">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">企業名 *</label>
            <input
              list="companies-list-test"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="企業名を入力"
            />
            <datalist id="companies-list-test">
              {companies.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">試験種別</label>
              <select
                value={form.testType}
                onChange={(e) => setForm({ ...form, testType: e.target.value as AptitudeTest["testType"] })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              >
                {APTITUDE_TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">受験日</label>
              <input
                type="date"
                value={form.testDate ?? ""}
                onChange={(e) => setForm({ ...form, testDate: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">結果</label>
            <div className="flex gap-2">
              {(["PENDING", "PASS", "FAIL"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setForm({ ...form, result: r })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    form.result === r
                      ? r === "PASS" ? "bg-green-100 text-green-700 border-green-300"
                        : r === "FAIL" ? "bg-red-100 text-red-700 border-red-300"
                        : "bg-gray-100 text-gray-700 border-gray-300"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {RESULT_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">スコア（任意）</label>
            <div className="grid grid-cols-3 gap-2">
              {(["scoreVerbal", "scoreNonverbal", "scoreEnglish"] as const).map((field, i) => (
                <div key={field}>
                  <p className="text-xs text-gray-400 mb-1">{["言語", "非言語", "英語"][i]}</p>
                  <input
                    type="number"
                    value={form[field] ?? ""}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
              placeholder="難易度・感想・対策メモなど"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmit} disabled={saving} className="flex-1">{saving ? "保存中..." : "保存する"}</Button>
            <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">キャンセル</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
