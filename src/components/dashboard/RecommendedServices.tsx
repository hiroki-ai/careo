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

// 就活生が実際に使ったサービス（URL検証済み）
const SERVICE_CATALOG: Record<string, Service> = {
  offerbox: {
    name: "OfferBox",
    url: "https://offerbox.jp/",
    tag: "逆求人No.1",
    tagColor: "bg-purple-100 text-purple-700",
    description: "企業から直接オファーが届く逆求人。AnalyzeU+適性診断付き。登録22,000社超。",
    careoTip: "届いたオファー企業をCareoに登録して選考管理しよう。",
  },
  mynavi: {
    name: "マイナビ",
    url: "https://job.mynavi.jp/",
    tag: "総合ナビ",
    tagColor: "bg-blue-100 text-blue-700",
    description: "中堅・中小企業に強い2大ナビサイトの一つ。",
    careoTip: "エントリーしたらCareoの企業管理に追加して一括管理しよう。",
  },
  rikunabi: {
    name: "リクナビ",
    url: "https://job.rikunabi.com/",
    tag: "総合ナビ",
    tagColor: "bg-red-100 text-red-700",
    description: "大手・中堅企業のエントリーはリクナビが網羅的。OpenESで一括応募も可。",
    careoTip: "リクナビとマイナビを併用し、応募企業はすべてCareoで一元管理。",
  },
  onecareer: {
    name: "ワンキャリア",
    url: "https://www.onecareer.jp/",
    tag: "ES・選考情報",
    tagColor: "bg-green-100 text-green-700",
    description: "ES例文・選考体験記・面接質問が充実。27卒利用率50%超。",
    careoTip: "面接質問をCareoの面接ログにメモして対策に活かそう。",
  },
  syukatsucaigi: {
    name: "就活会議",
    url: "https://syukatsu-kaigi.jp/",
    tag: "口コミ・ES",
    tagColor: "bg-amber-100 text-amber-700",
    description: "ES・選考体験記102万件超。企業口コミ・面接情報も充実。144,411社登録。",
    careoTip: "面接で聞かれた質問をCareoに記録して次回に備えよう。",
  },
  dodacampus: {
    name: "dodaキャンパス",
    url: "https://campus.doda.jp/",
    tag: "逆求人",
    tagColor: "bg-orange-100 text-orange-700",
    description: "パーソル運営の逆求人。登録99%にオファーが届く。インターン情報も豊富。",
    careoTip: "スカウト企業はCareoに登録してES・面接の進捗を管理しよう。",
  },
  wantedly: {
    name: "Wantedly",
    url: "https://www.wantedly.com/",
    tag: "IT・スタートアップ",
    tagColor: "bg-sky-100 text-sky-700",
    description: "カジュアル面談から始められるIT・ベンチャー特化サービス。",
    careoTip: "カジュアル面談後に企業をCareoへ追加して進捗を管理しよう。",
  },
  openwork: {
    name: "OpenWork",
    url: "https://www.openwork.jp/",
    tag: "企業口コミ",
    tagColor: "bg-teal-100 text-teal-700",
    description: "社員・元社員の口コミ2,100万件。企業の実態を8項目で評価。27卒利用急増。",
    careoTip: "志望企業の口コミを確認して面接の志望動機に活かそう。",
  },
  matcher: {
    name: "マッチャー",
    url: "https://matcher.jp/",
    tag: "OB/OG訪問",
    tagColor: "bg-rose-100 text-rose-700",
    description: "OB/OG訪問プラットフォーム。業界・職種で社会人を検索してOB訪問。",
    careoTip: "OB訪問したらCareoのOB/OG訪問ログに記録してPDCAに活用。",
  },
  brcampus: {
    name: "ビズリーチ・キャンパス",
    url: "https://br-campus.jp/",
    tag: "OB/OG訪問",
    tagColor: "bg-indigo-100 text-indigo-700",
    description: "国内118大学対応のOB/OGネットワーク。大学別にOBを検索・連絡できる。",
    careoTip: "OB訪問の気づきをCareoに記録して自己分析・企業研究に活用。",
  },
  gaishishukatsu: {
    name: "外資就活ドットコム",
    url: "https://gaishishukatsu.com/",
    tag: "外資・コンサル",
    tagColor: "bg-slate-100 text-slate-700",
    description: "外資系・コンサル・金融志望者向け特化サイト。AI面接練習機能あり。",
    careoTip: "スカウト企業はCareoに登録してES・面接の進捗を管理しよう。",
  },
  ababa: {
    name: "ABABA",
    url: "https://ababa.co.jp/",
    tag: "新興・逆求人",
    tagColor: "bg-pink-100 text-pink-700",
    description: "最終面接不合格者に別企業からスカウトが届く。近年急速に普及。",
    careoTip: "不採用になった企業もCareoに記録。次のスカウト企業もCareoで管理。",
  },
};

type ServiceStatus = "registered" | "dismissed";
const STORAGE_KEY = "careo_service_status";

function loadStatuses(): Record<string, ServiceStatus> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
}

function getRecommendations(companies: Company[], profile: UserProfile | null): string[] {
  const rejectedCount = companies.filter((c) => c.status === "REJECTED").length;
  const totalActive = companies.filter((c) => c.status !== "WISHLIST").length;
  const targetIndustries = profile?.targetIndustries?.join("") ?? "";
  const rec: string[] = [];

  // 基本: 全員に推奨
  rec.push("offerbox", "onecareer", "syukatsucaigi");

  if (rejectedCount > 0 || totalActive < 3) rec.push("dodacampus", "ababa");
  if (/IT|テック|スタートアップ|ベンチャー|Web/.test(targetIndustries)) rec.push("wantedly");
  if (/外資|グローバル|海外|コンサル/.test(targetIndustries)) rec.push("gaishishukatsu");
  if (!rec.includes("mynavi")) rec.push("mynavi");
  if (!rec.includes("rikunabi")) rec.push("rikunabi");
  if (!rec.includes("openwork")) rec.push("openwork");
  if (!rec.includes("matcher")) rec.push("matcher");

  return rec;
}

// Careoで削除した機能の代替サービス（固定表示）
const ALTERNATIVE_SERVICES = [
  {
    label: "ESを書く・添削する",
    services: [
      { name: "就活会議", url: "https://syukatsu-kaigi.jp/", desc: "先輩のES例文・選考体験が豊富。" },
      { name: "ワンキャリア", url: "https://www.onecareer.jp/", desc: "通過ESデータベース・選考対策記事。" },
      { name: "Unistyle", url: "https://unistyleinc.com/", desc: "内定者ES86,000件以上（無料）。" },
    ],
  },
  {
    label: "自己分析を深める",
    services: [
      { name: "StrengthsFinder", url: "https://www.gallup.com/cliftonstrengths/en/252137/home.aspx", desc: "強みを34資質で診断。ESの根拠づくりに。" },
      { name: "Claude / ChatGPT", url: "https://claude.ai/", desc: "対話で就活の軸・ガクチカを言語化。" },
    ],
  },
];

interface Props {
  companies: Company[];
  profile: UserProfile | null;
}

export function RecommendedServices({ companies, profile }: Props) {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({});
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { setStatuses(loadStatuses()); }, []);

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
  const allIds = [...recommended, ...Object.keys(SERVICE_CATALOG).filter(id => !recommended.includes(id))];
  const visible = allIds
    .filter(id => SERVICE_CATALOG[id])
    .filter(id => showAll ? true : !statuses[id])
    .slice(0, showAll ? undefined : 3);
  const hiddenCount = allIds.filter(id => SERVICE_CATALOG[id] && statuses[id]).length;

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
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                    title={s.desc}
                    className="text-xs bg-white border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">
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
            <button onClick={() => setShowAll(true)} className="text-xs text-blue-500 hover:underline">
              非表示{hiddenCount}件を表示
            </button>
          )}
          {showAll && (
            <button onClick={() => setShowAll(false)} className="text-xs text-gray-400 hover:underline">まとめる</button>
          )}
        </div>
      </div>

      {visible.length === 0 && !showAll ? (
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-400">すべてのサービスを整理しました</p>
          <button onClick={() => setShowAll(true)} className="text-xs text-blue-500 hover:underline mt-2 inline-block">
            全サービスを表示 ({Object.keys(SERVICE_CATALOG).length}件)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {visible.map((id) => {
            const s = SERVICE_CATALOG[id];
            const status = statuses[id];
            return (
              <div key={s.name}
                className={`bg-white border rounded-xl p-4 transition-all ${
                  status === "registered" ? "border-green-200 opacity-70"
                    : status === "dismissed" ? "border-gray-100 opacity-50"
                    : "border-gray-100 hover:shadow-md"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-sm">
                    {s.name} ↗
                  </a>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.tagColor}`}>{s.tag}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{s.description}</p>
                <div className="bg-blue-50 rounded-lg px-3 py-2 mb-3">
                  <p className="text-[11px] text-blue-700 font-medium">💡 Careoとの使い分け</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">{s.careoTip}</p>
                </div>
                <div className="flex gap-1.5">
                  {status === "registered" ? (
                    <button onClick={() => removeStatus(id)}
                      className="flex-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition-colors">
                      ✓ 登録済み（取り消す）
                    </button>
                  ) : status === "dismissed" ? (
                    <button onClick={() => removeStatus(id)}
                      className="flex-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                      再表示する
                    </button>
                  ) : (
                    <>
                      <button onClick={() => saveStatus(id, "registered")}
                        className="flex-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                        ✓ 登録済み
                      </button>
                      <button onClick={() => saveStatus(id, "dismissed")}
                        className="flex-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-gray-50 text-gray-400 border border-gray-200 hover:bg-gray-100 transition-colors">
                        興味なし
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
