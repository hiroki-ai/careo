"use client";

import { useState } from "react";
import { useCompanies } from "@/hooks/useCompanies";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface ComparisonItem {
  companyName: string;
  pros: string[];
  cons: string[];
  axisMatch: number;
}

interface CompareResult {
  recommendation: string;
  comparisons: ComparisonItem[];
  summary: string;
}

export default function OffersPage() {
  const { companies } = useCompanies();
  const { profile } = useProfile();
  const { showToast } = useToast();

  const [aiResult, setAiResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);

  const offeredCompanies = companies.filter((c) => c.status === "OFFERED");

  const handleCompare = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/offer-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies: offeredCompanies, profile }),
      });
      const text = await res.text();
      if (!text) throw new Error("Empty response");
      const data = JSON.parse(text);
      if ("error" in data) {
        showToast(
          (data as { error: string }).error.includes("多すぎ")
            ? (data as { error: string }).error
            : "AI比較の取得に失敗しました",
          "error"
        );
      } else {
        setAiResult(data as CompareResult);
      }
    } catch (err) {
      console.error("[offer-compare]", err);
      showToast("AI比較の取得に失敗しました", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">オファー比較</h1>
          <p className="text-sm text-gray-500 mt-1">内定企業を比較して最適な選択を</p>
        </div>
        {offeredCompanies.length >= 2 && (
          <Button onClick={handleCompare} disabled={loading}>
            {loading ? "AI分析中..." : "AI比較する"}
          </Button>
        )}
      </div>

      {/* 内定おめでとうバナー */}
      {offeredCompanies.length >= 1 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-800 text-sm">🎉 内定おめでとうございます！</p>
            <p className="text-xs text-gray-500 mt-0.5">Careoが役に立ったら、コーヒー1杯分の支援が励みになります</p>
          </div>
          <a
            href="https://buymeacoffee.com/careo"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            ☕ Buy me a coffee
          </a>
        </div>
      )}

      {offeredCompanies.length < 2 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-lg font-medium text-gray-500">内定が2社以上になると比較できます</p>
          <p className="text-sm mt-2">内定（OFFERED）ステータスの企業が2社以上登録されると、AI比較が利用できます。</p>
        </div>
      ) : (
        <>
          {/* 内定企業カード一覧 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {offeredCompanies.map((company) => (
              <div key={company.id} className="bg-white rounded-xl border border-green-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${company.is_intern_offer ? "bg-teal-100 text-teal-700" : "bg-green-100 text-green-700"}`}>
                    {company.is_intern_offer ? "インターン合格" : "内定"}
                  </span>
                  <h3 className="font-semibold text-gray-900">{company.name}</h3>
                </div>
                {company.industry && (
                  <p className="text-sm text-gray-500 mb-2">業界: {company.industry}</p>
                )}
                {company.notes && (
                  <p className="text-sm text-gray-600 line-clamp-3">{company.notes}</p>
                )}
              </div>
            ))}
          </div>

          {/* AI比較ボタン（モバイル用） */}
          <div className="md:hidden mb-6">
            <Button onClick={handleCompare} disabled={loading} className="w-full">
              {loading ? "AI分析中..." : "AI比較する"}
            </Button>
          </div>

          {/* AI分析ローディング */}
          {loading && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="h-4 bg-gray-100 rounded-full animate-pulse w-3/4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offeredCompanies.slice(0, 2).map((_, i) => (
                  <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="h-4 bg-gray-100 rounded-full animate-pulse w-1/2" />
            </div>
          )}

          {/* AI結果 */}
          {!loading && aiResult && (
            <div className="space-y-6">
              {/* 推奨 */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>🏆</span> AIのおすすめ
                </h2>
                <p className="text-sm text-gray-700">{aiResult.recommendation}</p>
              </div>

              {/* 比較テーブル */}
              <div>
                <h2 className="font-semibold text-gray-900 mb-3">詳細比較</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {aiResult.comparisons.map((comp) => (
                    <div key={comp.companyName} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">{comp.companyName}</h3>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-400">軸との一致度</span>
                          <span
                            className={`text-lg font-bold ${
                              comp.axisMatch >= 80
                                ? "text-green-600"
                                : comp.axisMatch >= 60
                                ? "text-yellow-600"
                                : "text-red-500"
                            }`}
                          >
                            {comp.axisMatch}%
                          </span>
                        </div>
                      </div>

                      {/* 一致度バー */}
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                        <div
                          className={`h-1.5 rounded-full ${
                            comp.axisMatch >= 80
                              ? "bg-green-500"
                              : comp.axisMatch >= 60
                              ? "bg-yellow-400"
                              : "bg-red-400"
                          }`}
                          style={{ width: `${comp.axisMatch}%` }}
                        />
                      </div>

                      <div className="mb-3">
                        <p className="text-xs font-semibold text-green-700 mb-1.5">メリット</p>
                        <ul className="space-y-1">
                          {comp.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                              <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-1.5">デメリット</p>
                        <ul className="space-y-1">
                          {comp.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                              <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* サマリー */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📝</span> まとめ
                </h2>
                <p className="text-sm text-gray-700">{aiResult.summary}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
