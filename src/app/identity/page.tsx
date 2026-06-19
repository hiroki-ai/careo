"use client";

import { useState } from "react";
import Link from "next/link";
import { IdentityEditor } from "@/components/profile/IdentityEditor";
import { QuickInput } from "@/components/quickinput/QuickInput";

export default function IdentityPage() {
  const [tab, setTab] = useState<"chat" | "form">("chat");

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/settings" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
          ← 設定に戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">🧬 Identity（軸・ビジョン・強み）</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI採点・面接対策・志望動機の精度は、ここの情報量で決まります。話して入れるか、フォームで埋めるかお好みで。
        </p>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-1 mb-5 p-1 bg-gray-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "chat" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🪄 話して入れる
        </button>
        <button
          type="button"
          onClick={() => setTab("form")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === "form" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 フォームで埋める
        </button>
      </div>

      {tab === "chat" ? (
        <div className="space-y-5">
          <QuickInput
            mode="identity"
            title="🪄 話して Identity を組み立てる"
            desc="軸・ガクチカ・強み・ビジョンを思いついた順に話してください。AIが構造化して該当フィールドに自動保存します。"
            placeholder="例: 軸は『俺が良いと思ったものを広めて、人の人生を変える』 / 強みは信頼を背負う力。サークル幹部で113名動員 / 10年後は年収1000万超で結婚もしてる"
          />
          <details className="bg-gray-50 rounded-lg border border-gray-100 p-4">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer">
              💡 どんなことを話せばいい?
            </summary>
            <div className="mt-3 text-xs text-gray-600 space-y-2 leading-relaxed">
              <p><b>軸:</b> なんでこの仕事がしたいのか / 一言で表すと / コアメッセージ</p>
              <p><b>軸の3層:</b> 最深層（人格の核）/ 中間層（能力）/ 表層（行動・経験）</p>
              <p><b>ガクチカ:</b> 学生時代に頑張ったこと（複数あればぜんぶ）</p>
              <p><b>強み:</b> 強み名 + 裏付けエピソード（例: 信頼を背負う力。サークル幹部で113名動員）</p>
              <p><b>ビジョン:</b> 5年後（28歳）/ 10年後（33歳）に実現したいこと（仕事・家庭・収入）</p>
              <p><b>職種:</b> 優先したい職種を順位で（戦略・事業企画 → マーケ → 営業 ...）</p>
            </div>
          </details>
        </div>
      ) : (
        <IdentityEditor />
      )}
    </div>
  );
}
