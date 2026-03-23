import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "就活管理アプリ比較 | Careo vs Notion・BaseMe・SmartES",
  description: "CareoとNotion・BaseMe・SmartESの違いを徹底比較。AI自動分析・横断データ気づき・完全無料など、Careoが選ばれる理由を解説。",
  alternates: {
    canonical: "https://careoai.jp/compare",
  },
};

const features = [
  { name: "AI自動分析", careo: "✅", notion: "❌", baseme: "❌", smartes: "△" },
  { name: "選考管理", careo: "✅", notion: "△（手動）", baseme: "❌", smartes: "❌" },
  { name: "ES管理", careo: "✅", notion: "△", baseme: "❌", smartes: "✅" },
  { name: "面接ログ", careo: "✅", notion: "△", baseme: "❌", smartes: "❌" },
  { name: "OB訪問管理", careo: "✅", notion: "❌", baseme: "❌", smartes: "❌" },
  { name: "データ横断気づき通知", careo: "✅", notion: "❌", baseme: "❌", smartes: "❌" },
  { name: "完全無料", careo: "✅", notion: "✅", baseme: "❌", smartes: "△" },
  { name: "登録不要", careo: "❌", notion: "✅", baseme: "❌", smartes: "❌" },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* ヘッダー */}
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold text-[#00c896] uppercase tracking-wider mb-4">
            就活管理アプリ比較
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            就活管理、まだNotionでやってますか？
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Notion・BaseMe・SmartESとCareoを徹底比較。AIが選考・ES・面接・OB訪問をまるごと管理する新しい就活スタイルをご紹介します。
          </p>
        </div>

        {/* 比較表 */}
        <div className="mb-16 overflow-x-auto">
          <table className="w-full border-collapse text-sm md:text-base">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4 font-semibold text-gray-700 border border-gray-200 min-w-[160px]">
                  機能
                </th>
                <th className="p-4 font-bold text-[#00c896] border border-gray-200 bg-[#00c896]/5 min-w-[100px]">
                  Careo
                </th>
                <th className="p-4 font-semibold text-gray-700 border border-gray-200 min-w-[100px]">
                  Notion
                </th>
                <th className="p-4 font-semibold text-gray-700 border border-gray-200 min-w-[100px]">
                  BaseMe
                </th>
                <th className="p-4 font-semibold text-gray-700 border border-gray-200 min-w-[100px]">
                  SmartES
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((row, i) => (
                <tr key={row.name} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="p-4 font-medium text-gray-800 border border-gray-200">
                    {row.name}
                  </td>
                  <td className="p-4 text-center border border-gray-200 bg-[#00c896]/5 font-semibold">
                    {row.careo}
                  </td>
                  <td className="p-4 text-center border border-gray-200 text-gray-600">
                    {row.notion}
                  </td>
                  <td className="p-4 text-center border border-gray-200 text-gray-600">
                    {row.baseme}
                  </td>
                  <td className="p-4 text-center border border-gray-200 text-gray-600">
                    {row.smartes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Careoが選ばれる理由 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Careoが選ばれる3つの理由
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-[#00c896]/10 to-[#00a87e]/5 rounded-2xl p-6 border border-[#00c896]/20">
              <div className="text-3xl mb-4">AI</div>
              <h3 className="font-bold text-gray-900 mb-2">AIが自動で分析</h3>
              <p className="text-sm text-gray-600">
                Notionのような手動管理は不要。AIが選考データを読み込み、次にすべき行動を自動提案します。
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#00c896]/10 to-[#00a87e]/5 rounded-2xl p-6 border border-[#00c896]/20">
              <div className="text-3xl mb-4">全</div>
              <h3 className="font-bold text-gray-900 mb-2">就活をまるごと管理</h3>
              <p className="text-sm text-gray-600">
                SmartESのようなES特化ではなく、選考・ES・面接・OB訪問まで全部一元管理。データが繋がることで気づきが生まれます。
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#00c896]/10 to-[#00a87e]/5 rounded-2xl p-6 border border-[#00c896]/20">
              <div className="text-3xl mb-4">無</div>
              <h3 className="font-bold text-gray-900 mb-2">完全無料</h3>
              <p className="text-sm text-gray-600">
                BaseMeのような有料プランなし。28卒向けに全機能を無料で提供しています。登録5分で始められます。
              </p>
            </div>
          </div>
        </div>

        {/* よくある質問 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            よくある質問
          </h2>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">Notionで管理していましたが、移行は大変ですか？</h3>
              <p className="text-gray-600 text-sm">
                移行ツールはありませんが、Careoは登録5分で使い始められます。Notionのデータを見ながら手入力するユーザーも多く、入力しながらAIアドバイスがもらえるため、すぐに価値を実感できます。
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">BaseMeとの違いは何ですか？</h3>
              <p className="text-gray-600 text-sm">
                BaseMeはOB訪問マッチングサービスですが、CareoはOB訪問のログ・振り返り管理に特化しています。訪問後の気づきをAIが分析し、ES・面接対策に活かす機能が特徴です。
              </p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-2">SmartESとの違いは何ですか？</h3>
              <p className="text-gray-600 text-sm">
                SmartESはES管理・添削に特化していますが、CareoはES管理に加えて選考管理・面接ログ・OB訪問管理・AIコーチング機能を提供します。就活全体をPDCAで回せるのがCareoの強みです。
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-[#0D0B21] to-[#1a2f4e] rounded-3xl p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            今すぐCareoを始める
          </h2>
          <p className="text-gray-300 mb-8">
            無料・登録5分。AI就活コーチが就活を全部把握します。
          </p>
          <Link
            href="/signup"
            className="inline-block bg-[#00c896] hover:bg-[#00a87e] text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors"
          >
            無料で始める
          </Link>
          <p className="text-gray-500 text-sm mt-4">クレジットカード不要・いつでも退会可能</p>
        </div>
      </div>
    </div>
  );
}
