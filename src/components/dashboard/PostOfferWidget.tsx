"use client";

import Link from "next/link";
import { Company } from "@/types";
import { useProfile } from "@/hooks/useProfile";
import { getShukatsuContext } from "@/lib/shukatsuSchedule";

interface PostOfferWidgetProps {
  offeredCompanies: Company[];
}

interface OfferContentItem {
  icon: string;
  title: string;
  desc: string;
  link: string;
  external?: boolean;
}

interface OfferContent {
  title: string;
  subtitle: string;
  items: OfferContentItem[];
}

const POST_OFFER_CONTENT: { intern: OfferContent; main: OfferContent } = {
  intern: {
    title: "インターン合格おめでとう！本選考に向けて準備しよう",
    subtitle: "インターン中に差をつける3つのアクション",
    items: [
      {
        icon: "📝",
        title: "インターンの学びをOB訪問記録に残す",
        desc: "本選考ESで使えるエピソードになる",
        link: "/ob-visits",
      },
      {
        icon: "🎯",
        title: "就活の軸をインターン経験で更新する",
        desc: "「なぜこの会社か」が格段に説得力を増す",
        link: "/career",
      },
      {
        icon: "💬",
        title: "カレオに本選考に向けた作戦を相談する",
        desc: "インターンデータを踏まえた個別アドバイス",
        link: "/chat",
      },
    ],
  },
  main: {
    title: "内定おめでとう！入社準備を始めよう",
    subtitle: "内定後にやっておくべきこと",
    items: [
      {
        icon: "📚",
        title: "入社前に読んでおきたいビジネス書",
        desc: "Amazonで業界別必読本をチェック",
        link: "https://www.amazon.co.jp/s?k=%E3%83%93%E3%82%B8%E3%83%8D%E3%82%B9%E6%9C%AC+%E5%85%A5%E7%A4%BE%E5%89%8D&tag=careo-22",
        external: true,
      },
      {
        icon: "🧑‍💼",
        title: "ビジネスマナーの基本を確認する",
        desc: "名刺交換・電話応対・メール文体",
        link: "/chat",
      },
      {
        icon: "🗂️",
        title: "就活データをキャリアセンターで共有する",
        desc: "Careoのレポートをエクスポートして持参",
        link: "/report",
      },
    ],
  },
};

export function PostOfferWidget({ offeredCompanies }: PostOfferWidgetProps) {
  const { profile } = useProfile();
  const shukatsuCtx = getShukatsuContext(profile?.graduationYear ?? 2028);
  const isInternPhase = shukatsuCtx.isInternPhase;

  const content = isInternPhase ? POST_OFFER_CONTENT.intern : POST_OFFER_CONTENT.main;
  const offeredName = offeredCompanies[0]?.name;

  return (
    <div className="mb-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="text-sm font-bold text-emerald-800">
            {offeredName ? `${offeredName}から` : ""}
            {isInternPhase ? "インターン合格" : "内定"}おめでとう！
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">{content.subtitle}</p>
        </div>
      </div>

      <div className="space-y-2">
        {content.items.map((item) => (
          <div key={item.title}>
            {item.external ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 bg-white/70 rounded-xl p-3 hover:bg-white transition-colors"
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{item.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </a>
            ) : (
              <Link
                href={item.link}
                className="flex items-start gap-2.5 bg-white/70 rounded-xl p-3 hover:bg-white transition-colors"
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{item.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </Link>
            )}
          </div>
        ))}
      </div>

      {offeredCompanies.length > 1 && (
        <p className="text-[10px] text-emerald-600 mt-3 text-center">
          他にも {offeredCompanies.length - 1} 社から{isInternPhase ? "インターン合格" : "内定"}があります →{" "}
          <Link href="/offers" className="underline">比較する</Link>
        </p>
      )}
    </div>
  );
}
