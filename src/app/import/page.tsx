"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CsvImportModal } from "@/components/companies/CsvImportModal";
import { useToast } from "@/components/ui/Toast";

const dataTypes = [
  { icon: "🏢", label: "企業管理", desc: "応募先・ウィッシュリスト・選考ステータス" },
  { icon: "📝", label: "ES内容", desc: "設問・回答・提出済みESのテキスト" },
  { icon: "👥", label: "面接ログ", desc: "日程・質問・結果・振り返りメモ" },
  { icon: "🤝", label: "OB/OG訪問", desc: "訪問先・メモ・企業カルチャー情報" },
  { icon: "📋", label: "筆記試験", desc: "受験企業・科目・結果" },
  { icon: "💡", label: "自己分析", desc: "就活の軸・ガクチカ・強み・弱み" },
];

export default function ImportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"csv" | "pdf" | "text">("pdf");

  const openWith = (tab: "csv" | "pdf" | "text") => {
    setDefaultTab(tab);
    setOpen(true);
  };

  const handleComplete = (counts: Record<string, number>) => {
    setOpen(false);
    const parts: string[] = [];
    if (counts.companies) parts.push(`企業 ${counts.companies}社`);
    if (counts.obVisits) parts.push(`OB訪問 ${counts.obVisits}件`);
    if (counts.tests) parts.push(`筆記試験 ${counts.tests}件`);
    if (counts.interviews) parts.push(`面接 ${counts.interviews}件`);
    showToast(
      parts.length > 0 ? `インポート完了：${parts.join("、")}` : "インポートが完了しました",
      "success"
    );
    router.push("/companies");
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">データをインポート</h1>
        <p className="text-sm text-gray-500">
          NotionやスプレッドシートをCareoに一括移行。AIが自動で分析して各機能に振り分けます。
        </p>
      </div>

      {/* 取り込めるデータの種類 */}
      <div className="mb-6 bg-gradient-to-br from-[#00c896]/5 to-emerald-50 border border-[#00c896]/20 rounded-2xl p-4">
        <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider mb-3">取り込めるデータ</p>
        <div className="grid grid-cols-2 gap-2">
          {dataTypes.map((d) => (
            <div key={d.label} className="flex items-start gap-2">
              <span className="text-base shrink-0">{d.icon}</span>
              <div>
                <p className="text-xs font-semibold text-gray-800">{d.label}</p>
                <p className="text-[11px] text-gray-400 leading-tight">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-3 pt-3 border-t border-[#00c896]/15">
          💡 ファイルやテキストをアップロードするだけで、AIが内容を解析して各機能に自動で情報を振り分けます
        </p>
      </div>

      {/* method cards */}
      <div className="space-y-3 mb-6">
        {/* PDF — メイン推奨 */}
        <button
          type="button"
          onClick={() => openWith("pdf")}
          className="w-full text-left bg-white border-2 border-[#00c896]/30 hover:border-[#00c896] hover:shadow-md rounded-2xl p-5 transition-all group active:scale-[0.99] relative overflow-hidden"
        >
          <div className="absolute top-3 right-3 text-[10px] font-bold bg-[#00c896] text-white px-2 py-0.5 rounded-full">おすすめ</div>
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0">📄</span>
            <div className="flex-1 min-w-0 pr-12">
              <p className="font-bold text-gray-900 text-sm mb-1 group-hover:text-[#00c896] transition-colors">
                PDFファイルをAI自動解析
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mb-2">
                NotionページやスプレッドシートをPDF出力してアップロード。AIが企業・ES・面接・OB訪問・筆記試験・自己分析まで、まとめて読み取って各機能に振り分けます。
              </p>
              <div className="flex flex-wrap gap-1.5">
                {["Notion", "Google Docs", "Word", "手書きメモ以外OK"].map((t) => (
                  <span key={t} className="text-[10px] text-[#00c896] bg-[#00c896]/8 px-2 py-0.5 rounded-md font-medium">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </button>

        {/* CSV */}
        <button
          type="button"
          onClick={() => openWith("csv")}
          className="w-full text-left bg-white border border-gray-200 hover:border-[#00c896] hover:shadow-sm rounded-2xl p-5 transition-all group active:scale-[0.99]"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0">📊</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm mb-1 group-hover:text-[#00c896] transition-colors">
                CSV / Excelからインポート
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mb-2">
                NotionのテーブルビューやExcelをCSVエクスポートしてアップロード。企業名・ステータスを自動マッピングして一括登録します。
              </p>
              <span className="inline-block text-[11px] text-[#00c896] bg-[#00c896]/8 px-2 py-0.5 rounded-md font-medium">
                💡 Notion → エクスポート → CSV形式
              </span>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-[#00c896] transition-colors shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* テキスト */}
        <button
          type="button"
          onClick={() => openWith("text")}
          className="w-full text-left bg-white border border-gray-200 hover:border-[#00c896] hover:shadow-sm rounded-2xl p-5 transition-all group active:scale-[0.99]"
        >
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0">✏️</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm mb-1 group-hover:text-[#00c896] transition-colors">
                企業名をテキストで貼り付け
              </p>
              <p className="text-xs text-gray-500 leading-relaxed mb-2">
                気になる企業名を1行1社で貼り付けるだけ。リクナビ・マイナビで見つけた企業をまとめて登録したいときに便利です。
              </p>
              <span className="inline-block text-[11px] text-[#00c896] bg-[#00c896]/8 px-2 py-0.5 rounded-md font-medium">
                💡 1行1社、何社でも一括登録
              </span>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-[#00c896] transition-colors shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* note */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
        <p className="font-semibold text-gray-700 mb-1">📌 ヒント</p>
        <ul className="space-y-1">
          <li>• インポート後も既存のデータは上書きされません</li>
          <li>• AIが抽出した内容は確認・編集してから保存できます</li>
          <li>• NotionのリッチテキストページはPDFエクスポートが便利です</li>
          <li>• 自己分析や就活の軸も書いてあればAIが自動で自己分析ページに反映します</li>
        </ul>
      </div>

      <CsvImportModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onImportComplete={handleComplete}
        defaultTab={defaultTab}
      />
    </div>
  );
}
