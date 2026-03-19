"use client";

import { useState, useEffect } from "react";
import { Company, UserProfile } from "@/types";

interface Service {
  name: string;
  url: string;
  tag: string;
  tagColor: string;
  description: string;
  careoTip: string;
}

// Careoで削除した機能の代替サービス（固定表示）
const ALTERNATIVE_SERVICES = [
  {
    label: "ES文章を書く・添削する",
    services: [
      { name: "就活会議", url: "https://syukatsu-kaigi.jp", desc: "先輩のES例文・選考体験が豊富。ES作成前の参考に。" },
      { name: "ワンキャリア", url: "https://www.onecareer.jp", desc: "ES添削・選考対策記事が充実。人気企業の通過ESを検索できる。" },
      { name: "Unistyle", url: "https://unistyle.jp", desc: "内定者ESデータベース。志望業界の通過ESをチェック。" },
    ],
  },
  {
    label: "自己分析を深める",
    services: [
      { name: "StrengthsFinder（クリフトン）", url: "https://www.gallup.com/cliftonstrengths/ja/253676/home.aspx", desc: "強みを34の資質で診断。ESや面接の根拠づくりに。" },
      { name: "Claude / ChatGPT", url: "https://claude.ai", desc: "「自己分析を手伝って」と話しかけてみよう。ガクチカの言語化にも。" },
    ],
  },
];

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

type ServiceStatus = "registered" | "dismissed";
const STORAGE_KEY = "careo_service_status";

function loadStatuses(): Record<string, ServiceStatus> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function getRecommendations(companies: Company[], profile: UserProfile | null): string[] {
  const rejectedCount = companies.filter((c) => c.status === "REJECTED").length;
  const totalActive = companies.filter((c) => !["WISHLIST"].includes(c.status)).length;
  const targetIndustries = profile?.targetIndustries?.join("") ?? "";

  const rec: string[] = [];

  if (rejectedCount > 0 || totalActive < 3) rec.push("offerbox");
  if (/IT|テック|スタートアップ|ベンチャー|Web/.test(targetIndustries)) rec.push("wantedly");
  if (/外資|グローバル|海外|英語/.test(targetIndustries)) rec.push("linkedin");
  if (/コンサル|IT|テック/.test(targetIndustries)) rec.push("goodfind");
  if (totalActive < 5) {
    if (!rec.includes("rikunabi")) rec.push("rikunabi");
    if (!rec.includes("mynavi")) rec.push("mynavi");
  }
  if (!rec.includes("syukatsucaigi")) rec.push("syukatsucaigi");

  return rec;
}

interface Props {
  companies: Company[];
  profile: UserProfile | null;
}

export function RecommendedServices({ companies, profile }: Props) {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setStatuses(loadStatuses());
  }, []);

  const saveStatus = (serviceId: string, status: ServiceStatus) => {
    const next = { ...statuses, [serviceId]: status };
    setStatuses(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const removeStatus = (serviceId: string) => {
    const next = { ...statuses };
    delete next[serviceId];
    setStatuses(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const recommended = getRecommendations(companies, profile);
  // 推奨リストに全サービスが含まれるよう、残りも末尾に追加
  const allIds = [...recommended, ...Object.keys(SERVICE_CATALOG).filter(id => !recommended.includes(id))];

  const visible = allIds
    .filter(id => SERVICE_CATALOG[id])
    .filter(id => {
      if (showAll) return true;
      return !statuses[id]; // dismissed/registered を除外
    })
    .slice(0, showAll ? undefined : 3);

  const hiddenCount = allIds.filter(id => SERVICE_CATALOG[id] && statuses[id]).length;

  if (visible.length === 0 && !showAll) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold text-gray-900">🔗 おすすめ就活サービス</h2>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">すべてのサービスを整理しました</p>
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-blue-500 hover:underline mt-2 inline-block"
          >
            全サービスを表示 ({Object.keys(SERVICE_CATALOG).length}件)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Careoにない機能→外部サービス案内 */}
      <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-900 mb-1">📌 CareoはデータとPDCAに特化しています</p>
        <p className="text-xs text-amber-700 mb-3">ES添削・自己分析などは以下の外部サービスをご活用ください。</p>
        <div className="space-y-3">
          {ALTERNATIVE_SERVICES.map((cat) => (
            <div key={cat.label}>
              <p className="text-[11px] font-bold text-amber-800 mb-1.5">{cat.label}</p>
              <div className="flex flex-wrap gap-2">
                {cat.services.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.desc}
                    className="text-xs bg-white border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    {s.name} ↗
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">🔗 おすすめ就活サービス</h2>
          <span className="text-xs text-gray-400">Careoと組み合わせて使おう</span>
        </div>
        <div className="flex items-center gap-2">
          {hiddenCount > 0 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs text-blue-500 hover:underline"
            >
              非表示{hiddenCount}件を表示
            </button>
          )}
          {showAll && (
            <button
              onClick={() => setShowAll(false)}
              className="text-xs text-gray-400 hover:underline"
            >
              まとめる
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {visible.map((id) => {
          const s = SERVICE_CATALOG[id];
          const status = statuses[id];
          return (
            <div
              key={s.name}
              className={`bg-white border rounded-xl p-4 transition-all ${
                status === "registered"
                  ? "border-green-200 opacity-70"
                  : status === "dismissed"
                  ? "border-gray-100 opacity-50"
                  : "border-gray-100 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm"
                >
                  {s.name} ↗
                </a>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.tagColor}`}>
                  {s.tag}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{s.description}</p>
              <div className="bg-blue-50 rounded-lg px-3 py-2 mb-3">
                <p className="text-[11px] text-blue-700 font-medium">💡 Careoとの使い分け</p>
                <p className="text-[11px] text-blue-600 mt-0.5">{s.careoTip}</p>
              </div>
              {/* アクションボタン */}
              <div className="flex gap-1.5">
                {status === "registered" ? (
                  <button
                    onClick={() => removeStatus(id)}
                    className="flex-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors"
                  >
                    ✓ 登録済み（取り消す）
                  </button>
                ) : status === "dismissed" ? (
                  <button
                    onClick={() => removeStatus(id)}
                    className="flex-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    再表示する
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => saveStatus(id, "registered")}
                      className="flex-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                      ✓ 登録済み
                    </button>
                    <button
                      onClick={() => saveStatus(id, "dismissed")}
                      className="flex-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      興味なし
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
