import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 86400; // 1日

export const metadata: Metadata = {
  title: "28卒・29卒 サマーインターン締切カレンダー 2026 | Careo",
  description: "2026年夏・早期選考・28卒/29卒向け主要企業のサマーインターン応募締切一覧。コンサル・外資・総合商社・金融・メーカー・IT・広告・コンサル業界を網羅。毎月更新。",
  openGraph: {
    title: "28卒・29卒 サマーインターン締切カレンダー 2026",
    description: "主要企業のサマーインターン締切を業界別に一覧。毎月更新、Careoで選考管理も可能。",
  },
};

interface Deadline {
  company: string;
  industry: string;
  deadline: string;
  note?: string;
}

// 2026年サマーインターン締切の代表的な企業（公開情報ベース。正確な日時は各企業サイトで確認推奨）
const DEADLINES_2026: Deadline[] = [
  // コンサル
  { company: "マッキンゼー・アンド・カンパニー", industry: "戦略コンサル", deadline: "5月上旬", note: "例年早期" },
  { company: "ボストン コンサルティング グループ", industry: "戦略コンサル", deadline: "5月中旬" },
  { company: "ベイン・アンド・カンパニー", industry: "戦略コンサル", deadline: "5月中旬" },
  { company: "アクセンチュア", industry: "総合コンサル", deadline: "5月下旬" },
  { company: "PwCコンサルティング", industry: "総合コンサル", deadline: "6月上旬" },
  { company: "デロイト トーマツ コンサルティング", industry: "総合コンサル", deadline: "6月上旬" },
  // 外資金融
  { company: "ゴールドマン・サックス", industry: "外資投資銀行", deadline: "5月中旬" },
  { company: "モルガン・スタンレー", industry: "外資投資銀行", deadline: "5月中旬" },
  { company: "JPモルガン", industry: "外資投資銀行", deadline: "5月下旬" },
  // 総合商社
  { company: "三菱商事", industry: "総合商社", deadline: "6月中旬" },
  { company: "三井物産", industry: "総合商社", deadline: "6月中旬" },
  { company: "伊藤忠商事", industry: "総合商社", deadline: "6月中旬" },
  { company: "住友商事", industry: "総合商社", deadline: "6月下旬" },
  { company: "丸紅", industry: "総合商社", deadline: "6月下旬" },
  // 日系金融
  { company: "三菱UFJ銀行", industry: "日系金融", deadline: "6月下旬" },
  { company: "三井住友銀行", industry: "日系金融", deadline: "6月下旬" },
  { company: "みずほフィナンシャルグループ", industry: "日系金融", deadline: "7月上旬" },
  { company: "野村證券", industry: "日系金融", deadline: "6月下旬" },
  // IT・Web
  { company: "Google Japan", industry: "外資IT", deadline: "5月中旬" },
  { company: "楽天グループ", industry: "国内IT", deadline: "6月下旬" },
  { company: "サイバーエージェント", industry: "国内IT", deadline: "7月上旬" },
  { company: "DeNA", industry: "国内IT", deadline: "7月中旬" },
  { company: "LINEヤフー", industry: "国内IT", deadline: "7月中旬" },
  { company: "リクルート", industry: "HR・Web", deadline: "6月中旬" },
  { company: "メルカリ", industry: "国内IT", deadline: "7月下旬" },
  // メーカー
  { company: "ソニーグループ", industry: "電機メーカー", deadline: "6月下旬" },
  { company: "パナソニック", industry: "電機メーカー", deadline: "7月上旬" },
  { company: "トヨタ自動車", industry: "自動車", deadline: "6月下旬" },
  { company: "ホンダ", industry: "自動車", deadline: "6月下旬" },
  { company: "味の素", industry: "食品", deadline: "6月下旬" },
  { company: "資生堂", industry: "化粧品", deadline: "7月上旬" },
  // 広告
  { company: "電通", industry: "広告", deadline: "6月中旬" },
  { company: "博報堂", industry: "広告", deadline: "6月中旬" },
  // マスコミ
  { company: "フジテレビジョン", industry: "テレビ", deadline: "6月上旬" },
  { company: "日本テレビ放送網", industry: "テレビ", deadline: "6月上旬" },
  // 不動産
  { company: "三菱地所", industry: "不動産", deadline: "6月下旬" },
  { company: "三井不動産", industry: "不動産", deadline: "6月下旬" },
];

function groupByMonth(items: Deadline[]): Record<string, Deadline[]> {
  const groups: Record<string, Deadline[]> = { "5月": [], "6月": [], "7月": [] };
  for (const d of items) {
    if (d.deadline.startsWith("5月")) groups["5月"].push(d);
    else if (d.deadline.startsWith("6月")) groups["6月"].push(d);
    else if (d.deadline.startsWith("7月")) groups["7月"].push(d);
  }
  return groups;
}

const INDUSTRIES = Array.from(new Set(DEADLINES_2026.map((d) => d.industry)));

export default function SummerInternCalendarPage() {
  const grouped = groupByMonth(DEADLINES_2026);

  return (
    <div className="min-h-screen font-zen-kaku py-8 md:py-12 px-4" style={{ background: "#fcfbf8", color: "#0D0B21" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-4">
          ← Careoトップ
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00c896]/12 text-[#00a87e] text-xs font-bold mb-3">
            2026年5〜7月 更新版
          </div>
          <h1 className="font-klee text-3xl md:text-5xl font-bold leading-tight mb-3">
            28卒・29卒<br />
            <span style={{ color: "#00a87e" }}>サマーインターン締切カレンダー</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl">
            主要企業のサマーインターン応募締切を業界別・月別に一覧。各社の公式情報を元にしていますが、正確な日時は必ず各社サイトでご確認ください。
          </p>
        </div>

        {/* 業界フィルタ（静的表示） */}
        <div className="mb-6">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">掲載業界</p>
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRIES.map((ind) => (
              <span key={ind} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                {ind}
              </span>
            ))}
          </div>
        </div>

        {/* 月別一覧 */}
        {Object.entries(grouped).map(([month, items]) => items.length > 0 && (
          <section key={month} className="mb-8">
            <h2 className="font-klee text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg, #00c896, #00a87e)" }} />
              {month}締切
              <span className="text-xs text-gray-400 font-normal">{items.length}社</span>
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-xs text-gray-500">
                    <th className="text-left py-2.5 px-4 font-semibold">企業名</th>
                    <th className="text-left py-2.5 px-4 font-semibold">業界</th>
                    <th className="text-left py-2.5 px-4 font-semibold">締切目安</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => (
                    <tr key={d.company} className="border-t border-gray-100">
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{d.company}</td>
                      <td className="py-2.5 px-4 text-gray-600">{d.industry}</td>
                      <td className="py-2.5 px-4 text-[#00a87e] font-bold">{d.deadline}{d.note && <span className="text-xs text-gray-400 ml-2">{d.note}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="rounded-3xl p-6 md:p-8 text-center mt-10" style={{ background: "linear-gradient(135deg, #00c896, #00a87e)" }}>
          <h3 className="font-klee text-xl md:text-2xl font-bold text-white mb-2">
            気になった企業を Careo に登録。<br />
            <span className="underline">締切リマインド・KPI管理</span>が一気通貫。
          </h3>
          <p className="text-white/85 text-xs md:text-sm mb-5">
            Careoで企業を登録すると、締切カレンダー・PDCA・AI「今週やること」まで全部自動連携。
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#00a87e] font-black px-7 py-3.5 rounded-xl text-[15px] shadow-xl"
          >
            無料で Careo を始める →
          </Link>
          <p className="text-white/60 text-[10px] mt-3">登録30秒 · クレカ不要 · 完全無料</p>
        </div>

        <p className="text-[10px] text-gray-400 mt-6 text-center">
          ※ 掲載情報は公開データと過去実績に基づく目安です。正確な日時は必ず各社公式サイトでご確認ください。
        </p>
      </div>
    </div>
  );
}
