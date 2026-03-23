"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { CsvImportModal } from "@/components/companies/CsvImportModal";
import { UserProfile } from "@/types";

type Step = 1 | 2 | 3;

type FormData = Omit<UserProfile, "id" | "createdAt" | "updatedAt">;

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile } = useProfile();
  const [step, setStep] = useState<Step>(1);
  const [importOpen, setImportOpen] = useState(false);
  const [importTab, setImportTab] = useState<"csv" | "pdf" | "text">("csv");
  const [importedCount, setImportedCount] = useState(0);

  const openImport = (tab: "csv" | "pdf" | "text") => {
    setImportTab(tab);
    setImportOpen(true);
  };

  const handleProfileSave = async (data: FormData) => {
    await saveProfile(data);
    setStep(2);
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* ステップインジケーター */}
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === s
                  ? "bg-[#00c896] text-white"
                  : step > s
                  ? "bg-[#00c896]/20 text-[#00c896]"
                  : "bg-gray-200 text-gray-400"
              }`}>
                {step > s ? "✓" : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${step > s ? "bg-[#00c896]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: プロフィール */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#00c896]">Careo</h1>
              <p className="text-gray-900 font-semibold mt-3">あなたのことを教えてください</p>
              <p className="text-sm text-gray-400 mt-1">AIがあなたに合ったアドバイスをします</p>
            </div>
            <ProfileForm onSubmit={handleProfileSave} submitLabel="次へ →" showSelfAnalysis />
          </div>
        )}

        {/* Step 2: データインポート */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-[#00c896]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📥</span>
              </div>
              <p className="text-gray-900 font-semibold">今まで管理していたデータを取り込もう</p>
              <p className="text-sm text-gray-400 mt-1">NotionやスプレッドシートのデータをそのままCareoに移行できます</p>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => openImport("csv")}
                className="w-full py-4 rounded-xl font-semibold border-2 border-[#00c896] text-[#00c896] hover:bg-[#00c896]/5 transition-colors flex items-center justify-center gap-2 text-base"
              >
                <span>📂</span>
                CSV・PDFでインポートする
              </button>
              <p className="text-xs text-gray-400 text-center">
                AIが企業名・ステータス・OB訪問・筆記試験を自動で読み取ります
              </p>
              <button
                type="button"
                onClick={() => openImport("text")}
                className="w-full py-3 rounded-xl font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span>✏️</span>
                企業名をテキストで入力する
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-3 rounded-xl text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                スキップして後で追加する →
              </button>
            </div>
          </div>
        )}

        <CsvImportModal
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
          onImportComplete={(counts) => {
            setImportedCount(counts.companies ?? 0);
            setImportOpen(false);
            setStep(3);
          }}
          defaultTab={importTab}
        />

        {/* Step 3: 完了・ウェルカム */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-[#00c896]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">準備完了！</h2>

            {/* AIウェルカムメッセージ */}
            <div className="bg-gray-50 rounded-xl p-4 my-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#00c896] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {importedCount > 0
                      ? `${importedCount}社をインポートしましたね。データがそろったので、すぐにAI分析を始められます。ダッシュボードで「今週何をすべきか」を確認しましょう。`
                      : `登録ありがとうございます！ダッシュボードで企業を追加したら、AIが選考状況を分析して「今週何をすべきか」を具体的に教えます。まずは気になる企業を追加してみましょう。`
                    }
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 bg-[#00c896]"
            >
              ダッシュボードへ →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
