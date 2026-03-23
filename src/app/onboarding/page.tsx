"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { CsvImportModal } from "@/components/companies/CsvImportModal";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types";

type Step = 1 | 2 | 3;

type FormData = Omit<UserProfile, "id" | "createdAt" | "updatedAt">;

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile } = useProfile();
  const [step, setStep] = useState<Step>(1);
  const [companyName, setCompanyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleProfileSave = async (data: FormData) => {
    await saveProfile(data);
    setStep(2);
  };

  const handleCompanySave = async () => {
    if (companyName.trim()) {
      setSaving(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("companies").insert({
        name: companyName.trim(),
        status: "WISHLIST",
        user_id: user!.id,
      });
      setSaving(false);
    }
    setStep(3);
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

        {/* Step 2: 最初の企業登録 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-[#00c896]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏢</span>
              </div>
              <p className="text-gray-900 font-semibold">企業を登録しよう</p>
              <p className="text-sm text-gray-400 mt-1">後でいくらでも追加・変更できます</p>
            </div>
            <div className="space-y-4">
              {/* CSV/PDF インポート */}
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="w-full py-3.5 rounded-xl font-semibold border-2 border-[#00c896] text-[#00c896] hover:bg-[#00c896]/5 transition-colors flex items-center justify-center gap-2"
              >
                <span>📥</span>
                NotionやスプレッドシートからCSV・PDFでインポート
              </button>
              <p className="text-xs text-gray-400 text-center -mt-2">
                AIが企業名・ステータス・OB訪問・筆記試験を自動で読み取ります
              </p>

              {/* 区切り */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">または1社だけ入力</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="例: Google Japan, 株式会社サイバーエージェント"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]"
                onKeyDown={(e) => e.key === "Enter" && handleCompanySave()}
              />
              <button
                onClick={handleCompanySave}
                disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white transition-colors"
                style={{ backgroundColor: "#00c896" }}
              >
                {saving ? "登録中..." : companyName.trim() ? "登録して次へ →" : "スキップ →"}
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
                      : companyName
                      ? `${companyName}を目標に登録しましたね。まずはダッシュボードで今週のアクションプランを確認しましょう。AIが選考状況を分析して、「今何をすべきか」を具体的に教えます。`
                      : `登録ありがとうございます！ダッシュボードで企業を登録したら、AIが選考状況を分析して「今週何をすべきか」を具体的に教えます。まずは気になる企業を追加してみましょう。`
                    }
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#00c896" }}
            >
              ダッシュボードへ →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
