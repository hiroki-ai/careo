"use client";

import { useState, useRef, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Company, CompanyStatus, COMPANY_STATUS_LABELS } from "@/types";

// ─── ステータス自動変換マップ ─────────────────────────────────────────────────

const STATUS_ALIASES: Record<string, CompanyStatus> = {
  // 気になる
  気になる: "WISHLIST", wishlist: "WISHLIST", "want to apply": "WISHLIST", 検討中: "WISHLIST", 未応募: "WISHLIST",
  // インターン系
  インターン応募: "INTERN_APPLYING", インターン選考: "INTERN_APPLYING", intern_applying: "INTERN_APPLYING",
  インターン書類: "INTERN_DOCUMENT", intern_document: "INTERN_DOCUMENT",
  "インターン1次": "INTERN_INTERVIEW_1", "インターン一次": "INTERN_INTERVIEW_1",
  "インターン2次": "INTERN_INTERVIEW_2", "インターン二次": "INTERN_INTERVIEW_2",
  インターン最終: "INTERN_FINAL", intern_final: "INTERN_FINAL",
  インターン中: "INTERN", インターン合格: "INTERN", intern: "INTERN",
  // 本選考
  応募済み: "APPLIED", 応募: "APPLIED", エントリー済み: "APPLIED", applied: "APPLIED",
  書類選考中: "DOCUMENT", 書類: "DOCUMENT", 書類選考: "DOCUMENT", document: "DOCUMENT",
  "1次面接": "INTERVIEW_1", 一次面接: "INTERVIEW_1", "1次": "INTERVIEW_1", interview1: "INTERVIEW_1", interview_1: "INTERVIEW_1",
  "2次面接": "INTERVIEW_2", 二次面接: "INTERVIEW_2", "2次": "INTERVIEW_2", interview2: "INTERVIEW_2", interview_2: "INTERVIEW_2",
  最終面接: "FINAL", 最終: "FINAL", final: "FINAL",
  内定: "OFFERED", 内定承諾: "OFFERED", 承諾: "OFFERED", offered: "OFFERED",
  不採用: "REJECTED", ng: "REJECTED", "NG": "REJECTED", rejected: "REJECTED", 落選: "REJECTED",
};

const parseStatus = (raw: string): CompanyStatus => {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "");
  // 完全一致（大文字小文字区別なし）
  for (const [key, val] of Object.entries(STATUS_ALIASES)) {
    if (normalized === key.toLowerCase()) return val;
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
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cells.push(cur); cur = "";
      } else {
        cur += ch;
      }
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
  const bom = "\uFEFF"; // Excel で文字化けしないよう BOM 付き
  const blob = new Blob([bom + TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "careo_企業リスト_テンプレート.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Props / コンポーネント ───────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: Omit<Company, "id" | "createdAt" | "updatedAt">[]) => Promise<void>;
}

type Step = "input" | "map" | "preview";

export function CsvImportModal({ isOpen, onClose, onImport }: Props) {
  const [tab, setTab] = useState<"csv" | "text">("csv");
  const [step, setStep] = useState<Step>("input");
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<CareoField[]>([]);
  const [preview, setPreview] = useState<Omit<Company, "id" | "createdAt" | "updatedAt">[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [textInput, setTextInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("input");
    setRawRows([]);
    setHeaders([]);
    setMapping([]);
    setPreview([]);
    setError("");
    setTextInput("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = useCallback((file: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length < 2) { setError("データ行が見つかりません。ヘッダー行 + 1行以上が必要です。"); return; }
      const hdrs = rows[0];
      const dataRows = rows.slice(1).filter(r => r.some(c => c.trim()));
      setHeaders(hdrs);
      setRawRows(dataRows);
      setMapping(hdrs.map(detectField));
      setStep("map");
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const buildPreview = useCallback(() => {
    const nameIdx = mapping.findIndex(m => m === "name");
    if (nameIdx === -1) { setError("「企業名」にマッピングされたカラムが必要です。"); return; }
    setError("");
    const rows = rawRows
      .filter(r => r[nameIdx]?.trim())
      .map(r => {
        const get = (field: CareoField) => {
          const idx = mapping.findIndex(m => m === field);
          return idx >= 0 ? (r[idx] ?? "").trim() : "";
        };
        const rawStatus = get("status");
        return {
          name: get("name"),
          industry: get("industry"),
          status: rawStatus ? parseStatus(rawStatus) : "WISHLIST" as CompanyStatus,
          url: get("url") || undefined,
          notes: get("notes") || undefined,
        };
      });
    setPreview(rows);
    setStep("preview");
  }, [mapping, rawRows]);

  const handleTextImport = async () => {
    const lines = textInput.split(/\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) { setError("企業名を入力してください"); return; }
    setImporting(true);
    try {
      await onImport(lines.map(name => ({ name, status: "WISHLIST", industry: "", notes: "" })));
      handleClose();
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      await onImport(preview);
      handleClose();
    } finally {
      setImporting(false);
    }
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
    <Modal isOpen={isOpen} onClose={handleClose} title="企業を一括インポート">
      <div className="space-y-4">

        {/* タブ */}
        {step === "input" && (
          <div className="flex border border-gray-200 rounded-xl overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setTab("csv")}
              className={`flex-1 py-2.5 font-medium transition-colors ${tab === "csv" ? "bg-[#00c896] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              CSVファイル
            </button>
            <button
              type="button"
              onClick={() => setTab("text")}
              className={`flex-1 py-2.5 font-medium transition-colors ${tab === "text" ? "bg-[#00c896] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
            >
              企業名を入力
            </button>
          </div>
        )}

        {/* ── Step: input / csv ────────────────────────────── */}
        {step === "input" && tab === "csv" && (
          <>
            {/* テンプレートDL */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3 text-xs">
              <div>
                <p className="font-semibold text-gray-700">Notion / スプレッドシートから移行</p>
                <p className="text-gray-400 mt-0.5">テンプレートCSVに合わせてコピーするか、カラムを自由に定義できます</p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="shrink-0 text-xs text-[#00a87e] font-bold border border-[#00c896]/40 rounded-lg px-3 py-2 hover:bg-[#00c896]/5 transition-colors"
              >
                テンプレDL
              </button>
            </div>

            {/* ドロップゾーン */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-[#00c896]/50 hover:bg-[#00c896]/3 transition-all"
            >
              <div className="text-3xl mb-2">📂</div>
              <p className="text-sm font-semibold text-gray-700 mb-1">CSVファイルをドロップ</p>
              <p className="text-xs text-gray-400">または クリックして選択（.csv）</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>• Notion → 「エクスポート」→「CSV」で出力</p>
              <p>• Google スプレッドシート → 「ファイル」→「ダウンロード」→「CSV」</p>
              <p>• Excel → 「名前を付けて保存」→「CSV UTF-8」</p>
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}
          </>
        )}

        {/* ── Step: input / text ───────────────────────────── */}
        {step === "input" && tab === "text" && (
          <>
            <p className="text-sm text-gray-500">企業名を1行に1社ずつ入力してください（ステータスはすべて「気になる」で登録されます）。</p>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={10}
              placeholder={"トヨタ自動車\nソニーグループ\n楽天グループ"}
              className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={handleClose} disabled={importing}>キャンセル</Button>
              <Button onClick={handleTextImport} disabled={importing}>{importing ? "追加中..." : "追加する"}</Button>
            </div>
          </>
        )}

        {/* ── Step: map ────────────────────────────────────── */}
        {step === "map" && (
          <>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">カラムのマッピング</p>
              <p className="text-xs text-gray-400 mb-4">CSVのカラムをCareoのフィールドに対応させてください。自動検出済みです。</p>
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-36 truncate shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">{h}</span>
                    <span className="text-gray-300 text-xs">→</span>
                    <select
                      value={mapping[i]}
                      onChange={(e) => {
                        const m = [...mapping];
                        m[i] = e.target.value as CareoField;
                        setMapping(m);
                      }}
                      className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-[#00c896] bg-white"
                    >
                      {careoFields.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-400">
              サンプル行：{rawRows[0]?.join("、")}
            </p>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setStep("input"); setError(""); }}>戻る</Button>
              <Button onClick={buildPreview}>プレビューを確認 →</Button>
            </div>
          </>
        )}

        {/* ── Step: preview ────────────────────────────────── */}
        {step === "preview" && (
          <>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">{preview.length}社をインポートします</p>
              <p className="text-xs text-gray-400 mb-3">最初の5件を表示（ステータスが認識できなかった場合は「気になる」になります）</p>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">企業名</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">業界</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">ステータス</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">メモ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.slice(0, 5).map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-medium text-gray-800 max-w-[120px] truncate">{r.name}</td>
                        <td className="px-3 py-2 text-gray-500 max-w-[80px] truncate">{r.industry || "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{COMPANY_STATUS_LABELS[r.status]}</td>
                        <td className="px-3 py-2 text-gray-400 max-w-[120px] truncate">{r.notes || "—"}</td>
                      </tr>
                    ))}
                    {preview.length > 5 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-gray-400 text-center">
                          ...他{preview.length - 5}社
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setStep("map")} disabled={importing}>戻る</Button>
              <Button onClick={handleConfirmImport} disabled={importing}>
                {importing ? "インポート中..." : `${preview.length}社をインポート`}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
