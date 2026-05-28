"use client";

import Link from "next/link";
import { IdentityEditor } from "@/components/profile/IdentityEditor";

export default function IdentityPage() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/settings" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">
          ← 設定に戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">🧬 Identity（軸・ビジョン・強み）</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI採点・面接対策・志望動機ジェネレーションの精度は、ここの情報量で決まります。
        </p>
      </div>
      <IdentityEditor />
    </div>
  );
}
