"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";

interface ReferralData {
  referralCode: string | null;
  referralUrl: string | null;
  referrerCount: number;
  referredBy: string | null;
  plan: "free" | "pro";
  planPeriodEnd: string | null;
}

export default function InvitePage() {
  const { showToast } = useToast();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/referral");
        if (res.ok) {
          setData(await res.json());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copyUrl = async () => {
    if (!data?.referralUrl) return;
    try {
      await navigator.clipboard.writeText(data.referralUrl);
      showToast("紹介リンクをコピーしました！", "success");
    } catch {
      showToast("コピーに失敗しました", "error");
    }
  };

  const shareToX = () => {
    if (!data?.referralUrl) return;
    const text = `就活の選考管理、Careoで全部ひとつに。\n今ならこのリンクから登録するとお互いにPro30日分もらえる 👇\n${data.referralUrl}`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareToLine = () => {
    if (!data?.referralUrl) return;
    const text = `Careoの紹介リンク：${data.referralUrl}`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`, "_blank");
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">読み込み中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold text-[#00a87e] tracking-widest uppercase mb-2">INVITE A FRIEND</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">友達を招待してお互いにPro30日分</h1>
        <p className="text-sm text-gray-500">
          あなたの紹介リンクから友達が登録すると、<b className="text-gray-700">あなたも友達もProプラン30日分</b>がもらえます。
        </p>
      </div>

      {/* 実績サマリー */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#00c896]/5 border border-[#00c896]/20 rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-[#00a87e] mb-1">紹介した人数</p>
          <p className="text-3xl font-black text-[#00a87e]">{data?.referrerCount ?? 0}<span className="text-sm font-normal text-gray-400 ml-1">人</span></p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-amber-700 mb-1">獲得したPro日数</p>
          <p className="text-3xl font-black text-amber-600">{(data?.referrerCount ?? 0) * 30}<span className="text-sm font-normal text-gray-400 ml-1">日</span></p>
        </div>
      </div>

      {/* 紹介リンク */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <p className="text-xs font-semibold text-gray-500 mb-2">あなたの紹介リンク</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={data?.referralUrl ?? ""}
            readOnly
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none"
          />
          <button
            type="button"
            onClick={copyUrl}
            className="px-4 py-2.5 bg-[#00c896] hover:bg-[#00b088] text-white text-sm font-bold rounded-xl transition-colors"
          >
            コピー
          </button>
        </div>
        {data?.referralCode && (
          <p className="text-[11px] text-gray-400 mt-2">
            紹介コード: <span className="font-mono font-bold text-gray-700">{data.referralCode}</span>
          </p>
        )}
      </div>

      {/* SNSシェア */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={shareToX}
          className="flex items-center justify-center gap-2 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-colors"
        >
          <span className="text-lg">𝕏</span> Xでシェア
        </button>
        <button
          type="button"
          onClick={shareToLine}
          className="flex items-center justify-center gap-2 py-3 bg-[#06C755] text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          <span>💬</span> LINEでシェア
        </button>
      </div>

      {/* 注意事項 */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
        <p className="text-sm font-bold text-gray-900 mb-2">💡 紹介の仕組み</p>
        <ul className="space-y-1.5 text-xs text-gray-600">
          <li className="flex items-start gap-1.5"><span className="shrink-0 mt-0.5">1.</span>友達があなたのリンクから登録</li>
          <li className="flex items-start gap-1.5"><span className="shrink-0 mt-0.5">2.</span>登録完了と同時にあなたと友達にPro30日分が自動付与</li>
          <li className="flex items-start gap-1.5"><span className="shrink-0 mt-0.5">3.</span>紹介人数に上限なし。Pro期間は累積</li>
          <li className="flex items-start gap-1.5"><span className="shrink-0 mt-0.5">4.</span>自分の別アカウントへの紹介は無効</li>
        </ul>
      </div>

      <div className="text-center">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← ダッシュボードに戻る</Link>
      </div>
    </div>
  );
}
