"use client";

import Link from "next/link";

export default function MentorsPage() {
  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-[#00c896]/20 to-emerald-100 rounded-2xl flex items-center justify-center mb-5">
        <span className="text-3xl">👨‍🎓</span>
      </div>
      <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
        <span>🔔</span> 近日公開
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">先輩に相談</h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        実際に就活を経験した先輩と繋がれる機能を準備中です。<br />
        業界・大学別に先輩を探して、リアルな体験談を聞いてみましょう。
      </p>
      <Link href="/">
        <button type="button" className="px-5 py-2.5 bg-[#00c896] text-white text-sm font-semibold rounded-xl active:opacity-80 transition-opacity">
          ホームに戻る
        </button>
      </Link>
    </div>
  );
}
