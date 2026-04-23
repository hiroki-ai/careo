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
        icon: "🤝",
        title: "後輩に匿名共有して先輩デビュー",
        desc: "通過したESや面接質問を29/30卒に共有できる",
        link: "/es",
      },
      {
        icon: "🎁",
        title: "友達を招待してProプラン延長",
        desc: "紹介した友達と自分の両方にPro30日分",
        link: "/invite",
      },
      {
        icon: "📊",
        title: "KPIで勝ちパターンを振り返る",
        desc: "本選考に活かせる業界別の相性が見える",
        link: "/metrics",
      },
    ],
  },
  main: {
    title: "内定おめでとう！後輩にもナレッジを引き継ごう",
    subtitle: "卒業前にやっておきたい3つのこと",
    items: [
      {
        icon: "🎓",
        title: "ESを後輩に匿名共有する",
        desc: "あなたの通過ESが29卒の参考データになる",
        link: "/es",
      },
      {
        icon: "🎤",
        title: "面接質問を後輩に匿名共有する",
        desc: "企業ごとの過去質問が後輩を助ける",
        link: "/interviews",
      },
      {
        icon: "🎁",
        title: "友達・後輩を招待する",
        desc: "紹介特典でお互いにPro30日分プレゼント",
        link: "/invite",
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
