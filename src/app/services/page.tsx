"use client";

import { useState, useEffect } from "react";

type ServiceStatus = "default" | "registered" | "dismissed";

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;        // アフィリエイトURL（設定後に更新）
  tag?: string;       // サービスの特徴タグ
  complement?: string; // Careoとの併用メモ
}

const SERVICES: Service[] = [
  {
    id: "rikunabi",
    name: "リクナビ",
    category: "求人・エントリー",
    description: "国内最大級の新卒求人サイト。インターン・本選考のエントリーはここ。",
    url: "https://job.rikunabi.com/",
    tag: "求人検索",
    complement: "Careoで管理する企業をリクナビでエントリー",
  },
  {
    id: "mynavi",
    name: "マイナビ",
    category: "求人・エントリー",
    description: "リクナビと並ぶ2大就活サイト。掲載企業が異なるので両方使うのがベスト。",
    url: "https://job.mynavi.jp/",
    tag: "求人検索",
    complement: "リクナビと併用して網羅性UP",
  },
  {
    id: "offerbox",
    name: "OfferBox",
    category: "スカウト型",
    description: "プロフィールを登録すると企業からスカウトが届く逆求人型。登録するだけでOK。",
    url: "https://offerbox.jp/",
    tag: "スカウト",
    complement: "スカウトが来た企業をCareoに登録して管理",
  },
  {
    id: "matcher",
    name: "Matcher",
    category: "OB/OG訪問",
    description: "OB/OG訪問のマッチングサービス。志望企業のOBに直接話を聞ける。",
    url: "https://matcher.jp/",
    tag: "OB訪問",
    complement: "訪問後の内容をCareoのOB訪問ページに記録",
  },
  {
    id: "gaishishukatsu",
    name: "外資就活ドットコム",
    category: "情報収集",
    description: "外資系・コンサル・総合商社志望者向けの就活情報サイト。選考体験談が充実。",
    url: "https://gaishishukatsu.com/",
    tag: "情報収集",
    complement: "面接・ES情報をCareoに記録しながら参考にする",
  },
  {
    id: "onecareer",
    name: "ONE CAREER",
    category: "情報収集",
    description: "選考フローや通過ESなど、リアルな選考情報が豊富。ES対策に必須。",
    url: "https://www.onecareer.jp/",
    tag: "選考情報",
    complement: "通過ESを参考にCareoのES管理に下書きを書く",
  },
  {
    id: "sugoshu",
    name: "すごい就活",
    category: "SPI・適性検査",
    description: "SPI・玉手箱などの適性検査に特化した対策サービス。筆記試験はここで対策。",
    url: "https://sugoshu.kokoshiro.jp/",
    tag: "SPI対策",
    complement: "SPI対策はすごい就活、選考管理はCareo",
  },
  {
    id: "doda-campus",
    name: "doda キャンパス",
    category: "スカウト型",
    description: "dodaが運営する逆求人サービス。OfferBoxと並ぶスカウト型の定番。",
    url: "https://campus.doda.jp/",
    tag: "スカウト",
    complement: "スカウト受信後、企業をCareoに登録",
  },
  {
    id: "career-ticket",
    name: "キャリアチケット",
    category: "エージェント",
    description: "就活エージェントサービス。選考対策の個別サポートが受けられる。",
    url: "https://careerticket.jp/",
    tag: "エージェント",
    complement: "エージェント経由の選考もCareoで一元管理",
  },
];

const CATEGORY_ORDER = ["求人・エントリー", "スカウト型", "OB/OG訪問", "SPI・適性検査", "情報収集", "エージェント"];

const CATEGORY_COLORS: Record<string, string> = {
  "求人・エントリー": "bg-blue-50 text-blue-700",
  "スカウト型":       "bg-purple-50 text-purple-700",
  "OB/OG訪問":        "bg-green-50 text-green-700",
  "SPI・適性検査":    "bg-orange-50 text-orange-700",
  "情報収集":         "bg-gray-100 text-gray-600",
  "エージェント":     "bg-pink-50 text-pink-700",
};

export default function ServicesPage() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({});
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("careo_service_statuses");
    if (saved) setStatuses(JSON.parse(saved));
  }, []);

  const updateStatus = (id: string, status: ServiceStatus) => {
    const next = { ...statuses, [id]: status };
    setStatuses(next);
    localStorage.setItem("careo_service_statuses", JSON.stringify(next));
  };

  const visibleServices = SERVICES.filter(s =>
    showDismissed ? statuses[s.id] === "dismissed" : statuses[s.id] !== "dismissed"
  );

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    services: visibleServices.filter(s => s.category === cat),
  })).filter(g => g.services.length > 0);

  const dismissedCount = SERVICES.filter(s => statuses[s.id] === "dismissed").length;
  const registeredCount = SERVICES.filter(s => statuses[s.id] === "registered").length;

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">おすすめ就活サービス</h1>
        <p className="text-sm text-gray-500 mt-1">Careoと組み合わせて使うとさらに効果的なサービスをまとめました</p>
      </div>

      {/* 進捗サマリー */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="bg-[#00c896]/10 rounded-xl px-4 py-2.5 text-center">
          <p className="text-xs text-gray-500">登録済み</p>
          <p className="text-xl font-bold text-[#00c896]">{registeredCount}<span className="text-sm font-normal text-gray-400">/{SERVICES.length}</span></p>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <p className="text-xs text-gray-500">登録が多いほど選考チャンスが増えます</p>
        </div>
      </div>

      {/* サービス一覧 */}
      {grouped.map(({ category, services }) => (
        <div key={category} className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{category}</h2>
          <div className="space-y-3">
            {services.map(service => {
              const status = statuses[service.id] ?? "default";
              return (
                <div key={service.id} className={`bg-white rounded-xl border p-4 transition-all ${
                  status === "registered" ? "border-[#00c896]/40 bg-[#00c896]/2" : "border-gray-100"
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[service.category]}`}>
                          {service.tag}
                        </span>
                        {status === "registered" && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#00c896]/15 text-[#00a87e]">✓ 登録済み</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{service.description}</p>
                      {service.complement && (
                        <p className="text-xs text-[#00a87e] bg-[#00c896]/8 px-2.5 py-1.5 rounded-lg">
                          💡 {service.complement}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => status === "default" && updateStatus(service.id, "default")}
                      className="flex-1 text-center py-2 rounded-lg text-sm font-medium bg-gray-900 hover:bg-gray-700 text-white transition-colors"
                    >
                      サイトを見る →
                    </a>
                    {status !== "registered" ? (
                      <button
                        onClick={() => updateStatus(service.id, "registered")}
                        className="px-3 py-2 rounded-lg text-sm font-medium border border-[#00c896] text-[#00c896] hover:bg-[#00c896]/10 transition-colors"
                      >
                        登録済みにする
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(service.id, "default")}
                        className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        取り消す
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(service.id, "dismissed")}
                      className="p-2 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors text-lg leading-none"
                      title="興味なし"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* 非表示サービスの表示切り替え */}
      {dismissedCount > 0 && (
        <button
          onClick={() => setShowDismissed(!showDismissed)}
          className="text-xs text-gray-400 hover:text-gray-600 underline mt-2"
        >
          {showDismissed ? "← 戻る" : `非表示にしたサービスを表示 (${dismissedCount}件)`}
        </button>
      )}
    </div>
  );
}
