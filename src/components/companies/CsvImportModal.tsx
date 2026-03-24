"use client";

import { useState, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Company, CompanyStatus } from "@/types";
import { ImportReviewModal, ImportData, ImportCompany } from "./ImportReviewModal";

// ─── ステータス自動変換マップ ─────────────────────────────────────────────────

const STATUS_ALIASES: Record<string, CompanyStatus> = {
  気になる: "WISHLIST", wishlist: "WISHLIST", 検討中: "WISHLIST", 未応募: "WISHLIST",
  インターン応募: "INTERN_APPLYING", インターン選考: "INTERN_APPLYING", intern_applying: "INTERN_APPLYING",
  インターン書類: "INTERN_DOCUMENT", intern_document: "INTERN_DOCUMENT",
  "インターン1次": "INTERN_INTERVIEW_1", "インターン一次": "INTERN_INTERVIEW_1",
  "インターン2次": "INTERN_INTERVIEW_2", "インターン二次": "INTERN_INTERVIEW_2",
  インターン最終: "INTERN_FINAL", intern_final: "INTERN_FINAL",
  インターン中: "INTERN", インターン合格: "INTERN", intern: "INTERN",
  応募済み: "APPLIED", 応募: "APPLIED", エントリー済み: "APPLIED", applied: "APPLIED",
  書類選考中: "DOCUMENT", 書類: "DOCUMENT", 書類選考: "DOCUMENT", document: "DOCUMENT",
  "1次面接": "INTERVIEW_1", 一次面接: "INTERVIEW_1", "1次": "INTERVIEW_1", interview1: "INTERVIEW_1",
  "2次面接": "INTERVIEW_2", 二次面接: "INTERVIEW_2", "2次": "INTERVIEW_2", interview2: "INTERVIEW_2",
  最終面接: "FINAL", 最終: "FINAL", final: "FINAL",
  内定: "OFFERED", 内定承諾: "OFFERED", offered: "OFFERED",
  不採用: "REJECTED", ng: "REJECTED", rejected: "REJECTED", 落選: "REJECTED",
};

const parseStatus = (raw: string): CompanyStatus => {
  const n = raw.trim().toLowerCase().replace(/\s+/g, "");
  for (const [key, val] of Object.entries(STATUS_ALIASES)) {
    if (n === key.toLowerCase()) return val;
  }
  return "WISHLIST";
};

// ─── カラム自動検出 ────────────────────────────────────────────────────────────

type CareoField = "name" | "industry" | "status" | "url" | "notes" | "(skip)";

const COLUMN_ALIASES: Record<CareoField, string[]> = {
  name: ["企業名", "会社名", "企業", "会社", "name", "company", "company_name"],
  industry: ["業界", "業種", "industry", "sector"],
  status: ["ステータス", "状態", "進捗", "status", "stage"],
  url: ["url", "URL", "ウェブサイト", "website", "サイト", "ホームページ"],
  notes: ["メモ", "備考", "notes", "note", "コメント", "comment", "remarks"],
  "(skip)": [],
};

const detectField = (header: string): CareoField => {
  const h = header.trim().toLowerCase();
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [CareoField, string[]][]) {
    if (field === "(skip)") continue;
    if (aliases.some(a => h === a.toLowerCase() || h.includes(a.toLowerCase()))) return field;
  }
  return "(skip)";
};

// ─── CSV パーサー ────────────────────────────────────────────────────────────

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let cur = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    rows.push(cells.map(c => c.trim()));
  }
  return rows;
}

// ─── テンプレート CSV ─────────────────────────────────────────────────────────

const TEMPLATE_CSV =
  "企業名,業界,ステータス,URL,メモ\n" +
  "トヨタ自動車,自動車,気になる,https://toyota.jp,OB訪問済み\n" +
  "ソニーグループ,電機・精密,応募済み,,ES提出日: 2月1日\n" +
  "楽天グループ,IT・通信,書類選考中,,\n";

const downloadTemplate = () => {
  const bom = "\uFEFF";
  const blob = new Blob([bom + TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "careo_企業リスト_テンプレート.csv"; a.click();
  URL.revokeObjectURL(url);
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (counts: Record<string, number>) => void;
  defaultTab?: "csv" | "pdf" | "text";
}

type Step = "input" | "map";

export function CsvImportModal({ isOpen, onClose, onImportComplete, defaultTab = "csv" }: Props) {
  const [tab, setTab] = useState<"csv" | "pdf" | "text">(defaultTab);
  const [step, setStep] = useState<Step>("input");
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CareoField[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const [textInput, setTextInput] = useState("");
  const [reviewData, setReviewData] = useState<ImportData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("input"); setRawRows([]); setHeaders([]); setMapping([]);
    setError(""); setTextInput(""); setReviewData(null);
    if (fileRef.current) fileRef.current.value = "";
    if (pdfRef.current) pdfRef.current.value = "";
  };
  const handleClose = () => { reset(); onClose(); };

  // ─ PDF ─
  const handlePdfFile = useCallback(async (file: File) => {
    setError(""); setPdfLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      let res: Response;
      try {
        res = await fetch("/api/import/pdf", { method: "POST", body: form });
      } catch {
        setError("ネットワークエラーが発生しました。接続を確認してもう一度お試しください。");
        return;
      }
      let json: {
        companies?: ImportCompany[];
        obVisits?: ImportData["obVisits"];
        tests?: ImportData["tests"];
        interviews?: ImportData["interviews"];
        error?: string;
      };
      try {
        json = await res.json() as typeof json;
      } catch {
        setError("サーバーからの応答が不正です。もう一度お試しください。");
        return;
      }
      if (!res.ok || json.error) { setError(json.error ?? "解析に失敗しました"); return; }
      const total = (json.companies?.length ?? 0) + (json.obVisits?.length ?? 0) +
        (json.tests?.length ?? 0) + (json.interviews?.length ?? 0);
      if (!total) { setError("就活情報が見つかりませんでした。企業名・選考状況などが含まれるPDFをお試しください。"); return; }
      setReviewData({
        companies: (json.companies ?? []).map(c => ({ name: c.name ?? "", industry: c.industry ?? "", status: (c.status as CompanyStatus) ?? "WISHLIST", notes: c.notes ?? "", url: c.url })),
        obVisits: json.obVisits ?? [],
        tests: json.tests ?? [],
        interviews: json.interviews ?? [],
      });
    } finally { setPdfLoading(false); }
  }, []);

  // ─ CSV ─
  const handleFile = useCallback((file: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length < 2) { setError("データ行が見つかりません。ヘッダー行 + 1行以上が必要です。"); return; }
      setHeaders(rows[0]); setRawRows(rows.slice(1).filter(r => r.some(c => c.trim())));
      setMapping(rows[0].map(detectField)); setStep("map");
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const buildReviewFromCsv = useCallback(() => {
    const nameIdx = mapping.findIndex(m => m === "name");
    if (nameIdx === -1) { setError("「企業名」にマッピングされたカラムが必要です。"); return; }
    setError("");
    const companies: ImportCompany[] = rawRows
      .filter(r => r[nameIdx]?.trim())
      .map(r => {
        const get = (f: CareoField) => { const i = mapping.findIndex(m => m === f); return i >= 0 ? (r[i] ?? "").trim() : ""; };
        const raw = get("status");
        return { name: get("name"), industry: get("industry"), status: raw ? parseStatus(raw) : "WISHLIST", url: get("url") || undefined, notes: get("notes") };
      });
    setReviewData({ companies, obVisits: [], tests: [], interviews: [] });
  }, [mapping, rawRows]);

  // ─ テキスト ─
  const buildReviewFromText = () => {
    const lines = textInput.split(/\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) { setError("企業名を入力してください"); return; }
    setReviewData({ companies: lines.map(name => ({ name, status: "WISHLIST", industry: "", notes: "" })), obVisits: [], tests: [], interviews: [] });
  };

  const careoFields: { value: CareoField; label: string }[] = [
    { value: "(skip)", label: "（スキップ）" },
    { value: "name", label: "企業名 *" },
    { value: "industry", label: "業界" },
    { value: "status", label: "ステータス" },
    { value: "url", label: "URL" },
    { value: "notes", label: "メモ" },
  ];

  return (
    <>
      <Modal isOpen={isOpen && !reviewData} onClose={handleClose} title="企業を一括インポート">
        <div className="space-y-4">

          {/* タブ */}
          {step === "input" && (
            <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
              {(["csv", "pdf", "text"] as const).map((t, _, arr) => (
                <button key={t} type="button" onClick={() => { setTab(t); setError(""); }}
                  className={`flex-1 py-2.5 font-medium transition-colors ${tab === t ? "bg-[#00c896] text-white" : "bg-white text-gray-500 hover:bg-gray-50"} ${arr.indexOf(t) < arr.length - 1 ? "border-r border-gray-200" : ""}`}>
                  {t === "csv" ? "CSV" : t === "pdf" ? "PDF" : "テキスト入力"}
                </button>
              ))}
            </div>
          )}

          {/* ── CSV ── */}
          {step === "input" && tab === "csv" && (
            <>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 text-xs">
                <div>
                  <p className="font-semibold text-gray-700">Notion / スプレッドシートから移行</p>
                  <p className="text-gray-400 mt-0.5">カラム名は自由・自動検出します</p>
                </div>
                <button type="button" onClick={downloadTemplate}
                  className="shrink-0 text-xs text-[#00a87e] font-bold border border-[#00c896]/40 rounded-lg px-3 py-2 hover:bg-[#00c896]/5 transition-colors">
                  テンプレDL
                </button>
              </div>
              <div onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()} onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-[#00c896]/50 hover:bg-[#00c896]/3 transition-all">
                <div className="text-3xl mb-2">📂</div>
                <p className="text-sm font-semibold text-gray-700 mb-1">CSVファイルをドロップ</p>
                <p className="text-xs text-gray-400">または クリックして選択（.csv）</p>
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" title="CSVファイルを選択"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Notion（テーブル形式のみ）→「...」→「エクスポート」→「CSV」</p>
                <p>• Google スプレッドシート →「ファイル」→「ダウンロード」→「CSV」</p>
                <p>• Excel →「名前を付けて保存」→「CSV UTF-8」</p>
                <p className="text-amber-500">※ Notionのテキストページ（箇条書き等）は PDF タブをお使いください</p>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </>
          )}

          {/* ── PDF ── */}
          {step === "input" && tab === "pdf" && (
            <>
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1 border border-blue-100">
                <p className="font-semibold">AIがPDFを読んで就活情報を自動抽出します</p>
                <p className="text-blue-500">企業・OB訪問・筆記試験・面接の記録を一括で取り込めます。抽出後に編集も可能。</p>
              </div>
              <div
                onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handlePdfFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()} onClick={() => !pdfLoading && pdfRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${pdfLoading ? "border-blue-200 bg-blue-50/50 cursor-wait" : "border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30"}`}>
                {pdfLoading ? (
                  <div className="space-y-3">
                    <div className="text-3xl animate-pulse">🤖</div>
                    <p className="text-sm font-semibold text-blue-600">AIが解析中...</p>
                    <p className="text-xs text-gray-400">企業・OB訪問・筆記試験・面接を読み取っています</p>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">PDFファイルをドロップ</p>
                    <p className="text-xs text-gray-400">または クリックして選択（.pdf・最大10MB）</p>
                  </>
                )}
                <input ref={pdfRef} type="file" accept=".pdf,application/pdf" className="hidden" title="PDFファイルを選択"
                  onChange={e => e.target.files?.[0] && handlePdfFile(e.target.files[0])} />
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Notion → 「...」→「エクスポート」→「PDF」（テキスト・テーブル両方OK）</p>
                <p>• Word / Google Docs → 「ダウンロード」→「PDF」</p>
                <p>• キャリアセンターの様式・自作管理シートもそのままOK</p>
                <p className="text-amber-500">※ スキャン画像のみのPDFは非対応</p>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </>
          )}

          {/* ── テキスト入力 ── */}
          {step === "input" && tab === "text" && (
            <>
              <p className="text-sm text-gray-500">企業名を1行に1社ずつ入力してください（ステータスはすべて「気になる」で登録）。</p>
              <textarea value={textInput} onChange={e => setTextInput(e.target.value)} rows={10}
                placeholder={"トヨタ自動車\nソニーグループ\n楽天グループ"}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-blue-400 resize-none" />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={handleClose}>キャンセル</Button>
                <Button onClick={buildReviewFromText}>内容を確認する →</Button>
              </div>
            </>
          )}

          {/* ── カラムマッピング ── */}
          {step === "map" && (
            <>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">カラムのマッピング</p>
                <p className="text-xs text-gray-400 mb-4">CSVのカラムをCareoのフィールドに対応させてください。</p>
                <div className="space-y-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-36 truncate shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">{h}</span>
                      <span className="text-gray-300 text-xs">→</span>
                      <select value={mapping[i]} onChange={e => { const m = [...mapping]; m[i] = e.target.value as CareoField; setMapping(m); }}
                        title={`「${h}」のマッピング先`}
                        className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-[#00c896] bg-white">
                        {careoFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">サンプル行：{rawRows[0]?.join("、")}</p>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => { setStep("input"); setError(""); }}>戻る</Button>
                <Button onClick={buildReviewFromCsv}>内容を確認する →</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* レビューモーダル */}
      {reviewData && (
        <ImportReviewModal
          isOpen={true}
          onClose={() => setReviewData(null)}
          data={reviewData}
          onComplete={(counts) => { onImportComplete(counts); reset(); onClose(); }}
        />
      )}
    </>
  );
}
