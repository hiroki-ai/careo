import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "28卒 サマーインターン締切カレンダー 2026 | Careo",
  description: "2026年夏・早期選考・28卒向け主要企業のサマーインターン応募締切一覧。コンサル・外資・総合商社・金融・メーカー・IT・広告業界を網羅。毎週月曜自動更新。",
  openGraph: {
    title: "28卒 サマーインターン締切カレンダー 2026",
    description: "主要企業のサマーインターン締切を業界別に一覧。毎週月曜に最新情報を自動更新。",
  },
};

interface DeadlineRow {
  company_name: string;
  industry: string | null;
  deadline_display: string;
  deadline_sort_key: number | null;
  note: string | null;
  updated_at: string;
}

async function getDeadlines(year: number): Promise<DeadlineRow[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("summer_intern_deadlines")
      .select("company_name, industry, deadline_display, deadline_sort_key, note, updated_at")
      .eq("year", year)
      .order("deadline_sort_key", { ascending: true });
    return (data as DeadlineRow[]) ?? [];
  } catch {
    return [];
  }
}

function groupByMonth(items: DeadlineRow[]): Record<string, DeadlineRow[]> {
  const groups: Record<string, DeadlineRow[]> = { "5月": [], "6月": [], "7月": [], "その他": [] };
  for (const d of items) {
    if (d.deadline_display.startsWith("5月")) groups["5月"].push(d);
    else if (d.deadline_display.startsWith("6月")) groups["6月"].push(d);
    else if (d.deadline_display.startsWith("7月")) groups["7月"].push(d);
    else groups["その他"].push(d);
  }
  return groups;
}

export default async function SummerInternCalendarPage() {
  const now = new Date();
  const targetYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
  const rows = await getDeadlines(targetYear);
  const grouped = groupByMonth(rows);
  const industries = Array.from(new Set(rows.map((d) => d.industry).filter((x): x is string => !!x)));
  const lastUpdated = rows[0]?.updated_at ? new Date(rows[0].updated_at) : null;

  return (
    <div className="min-h-screen font-zen-kaku py-8 md:py-12 px-4" style={{ background: "#fcfbf8", color: "#0D0B21" }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-4">
          ← Careoトップ
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00c896]/12 text-[#00a87e] text-xs font-bold mb-3">
            {targetYear}年5〜7月 版 · 毎週月曜自動更新
          </div>
          <h1 className="font-klee text-3xl md:text-5xl font-bold leading-tight mb-3">
            28卒<br />
            <span style={{ color: "#00a87e" }}>サマーインターン締切カレンダー</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl">
            主要企業のサマーインターン応募締切を業界別・月別に一覧。AIが週次で自動リサーチし、最新情報を反映しています。正確な日時は必ず各社公式サイトでご確認ください。
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-2">最終更新: {lastUpdated.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}</p>
          )}
        </div>

        {rows.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-amber-900 font-semibold">データが読み込めませんでした</p>
            <p className="text-xs text-amber-700 mt-1">しばらく経ってから再読み込みしてください。</p>
          </div>
        )}

        {industries.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">掲載業界</p>
            <div className="flex flex-wrap gap-1.5">
              {industries.map((ind) => (
                <span key={ind} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}

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
                    <tr key={d.company_name} className="border-t border-gray-100">
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{d.company_name}</td>
                      <td className="py-2.5 px-4 text-gray-600">{d.industry ?? "—"}</td>
                      <td className="py-2.5 px-4 text-[#00a87e] font-bold">
                        {d.deadline_display}
                        {d.note && <span className="text-xs text-gray-400 ml-2">{d.note}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

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
