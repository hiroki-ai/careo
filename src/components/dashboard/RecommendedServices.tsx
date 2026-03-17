"use client";

import { Company, UserProfile } from "@/types";

interface Service {
  name: string;
  url: string;
  tag: string;
  tagColor: string;
  description: string;
  careoTip: string;
}

const SERVICE_CATALOG: Record<string, Service> = {
  offerbox: {
    name: "OfferBox",
    url: "https://offerbox.jp",
    tag: "スカウト型",
    tagColor: "bg-purple-100 text-purple-700",
    description: "企業から直接オファーが届く逆求人サービス。",
    careoTip: "届いたオファー企業をCareoに登録して選考管理しよう。",
  },
  wantedly: {
    name: "Wantedly",
    url: "https://www.wantedly.com",
    tag: "IT・スタートアップ",
    tagColor: "bg-blue-100 text-blue-700",
    description: "カジュアル面談から始められるIT・ベンチャー特化サービス。",
    careoTip: "カジュアル面談後に企業をCareoへ追加して進捗を管理しよう。",
  },
  rikunabi: {
    name: "リクナビ",
    url: "https://job.rikunabi.com",
    tag: "大手・中堅",
    tagColor: "bg-red-100 text-red-700",
    description: "大手・中堅企業のエントリーはリクナビが網羅的。",
    careoTip: "エントリーしたらCareoの企業管理に追加して一括管理しよう。",
  },
  mynavi: {
    name: "マイナビ",
    url: "https://job.mynavi.jp",
    tag: "中堅・中小",
    tagColor: "bg-blue-100 text-blue-700",
    description: "中堅・中小企業に強い。リクナビと並行利用が基本。",
    careoTip: "リクナビと合わせて使い、応募企業はすべてCareoで一元管理。",
  },
  syukatsucaigi: {
    name: "就活会議",
    url: "https://syukatsu-kaigi.jp",
    tag: "口コミ・ES事例",
    tagColor: "bg-green-100 text-green-700",
    description: "先輩の選考体験・ES・面接質問が豊富。ES作成前に必ず確認。",
    careoTip: "面接質問をCareoの面接ログにメモして対策に活かそう。",
  },
  linkedin: {
    name: "LinkedIn",
    url: "https://www.linkedin.com",
    tag: "外資・グローバル",
    tagColor: "bg-sky-100 text-sky-700",
    description: "外資系・グローバル企業志望なら必須のプロフィール整備。",
    careoTip: "LinkedIn経由で進んだ選考はCareoに追加して管理しよう。",
  },
  goodfind: {
    name: "GoodFind",
    url: "https://goodfind.jp",
    tag: "IT・コンサル特化",
    tagColor: "bg-indigo-100 text-indigo-700",
    description: "IT・コンサルに特化した逆求人型サービス。",
    careoTip: "スカウト企業はCareoに登録してES・面接の進捗を管理しよう。",
  },
};

function getRecommendations(companies: Company[], profile: UserProfile | null): Service[] {
  const rejectedCount = companies.filter((c) => c.status === "REJECTED").length;
  const totalActive = companies.filter((c) => !["WISHLIST"].includes(c.status)).length;
  const targetIndustries = profile?.targetIndustries?.join("") ?? "";

  const rec: string[] = [];

  // スカウト型：不採用が出た or 選考中が少ない
  if (rejectedCount > 0 || totalActive < 3) rec.push("offerbox");

  // 業界別
  if (/IT|テック|スタートアップ|ベンチャー|Web/.test(targetIndustries)) rec.push("wantedly");
  if (/外資|グローバル|海外|英語/.test(targetIndustries)) rec.push("linkedin");
  if (/コンサル|IT|テック/.test(targetIndustries)) rec.push("goodfind");

  // 企業数が少ない → 大手ナビ
  if (totalActive < 5) {
    if (!rec.includes("rikunabi")) rec.push("rikunabi");
    if (!rec.includes("mynavi")) rec.push("mynavi");
  }

  // 常に就活会議は有用
  if (!rec.includes("syukatsucaigi")) rec.push("syukatsucaigi");

  return rec.slice(0, 3).map((id) => SERVICE_CATALOG[id]);
}

interface Props {
  companies: Company[];
  profile: UserProfile | null;
}

export function RecommendedServices({ companies, profile }: Props) {
  const services = getRecommendations(companies, profile);

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-gray-900">🔗 おすすめ就活サービス</h2>
        <span className="text-xs text-gray-400">Careoと組み合わせて使おう</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {services.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {s.name}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.tagColor}`}>
                {s.tag}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{s.description}</p>
            <div className="bg-blue-50 rounded-lg px-3 py-2">
              <p className="text-[11px] text-blue-700 font-medium">💡 Careoとの使い分け</p>
              <p className="text-[11px] text-blue-600 mt-0.5">{s.careoTip}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
