import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 3600; // 1時間ごとに再生成

const ACCENT = "#00c896";
const ACCENT_DEEP = "#00a87e";
const INK = "#0D0B21";
const BG = "#fcfbf8";

interface Stats {
  totalUsers: number;
  proUsers: number;
  activeCompanies: number;
  totalEs: number;
  totalInterviews: number;
  totalOffers: number;
  totalReferrals: number;
}

async function getStats(): Promise<Stats> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [users, pros, companies, es, interviews, offers, referrals] = await Promise.all([
    supabase.from("user_profiles").select("*", { count: "exact", head: true }),
    supabase.from("user_profiles").select("*", { count: "exact", head: true }).eq("plan", "pro"),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase.from("es_entries").select("*", { count: "exact", head: true }),
    supabase.from("interviews").select("*", { count: "exact", head: true }),
    supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "OFFERED"),
    supabase.from("referrals").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: users.count ?? 0,
    proUsers: pros.count ?? 0,
    activeCompanies: companies.count ?? 0,
    totalEs: es.count ?? 0,
    totalInterviews: interviews.count ?? 0,
    totalOffers: offers.count ?? 0,
    totalReferrals: referrals.count ?? 0,
  };
}

export default async function StatsPage() {
  let stats: Stats | null = null;
  try {
    stats = await getStats();
  } catch {
    stats = null;
  }

  const cards = stats ? [
    { label: "累計ユーザー数", value: stats.totalUsers, unit: "人", tint: ACCENT, subtle: "Careoに登録した学生" },
    { label: "Proプラン加入者", value: stats.proUsers, unit: "人", tint: "#f59e0b", subtle: `転換率 ${stats.totalUsers > 0 ? Math.round((stats.proUsers / stats.totalUsers) * 1000) / 10 : 0}%` },
    { label: "登録企業数", value: stats.activeCompanies, unit: "社", tint: "#60a5fa", subtle: "全ユーザーの応募先合算" },
    { label: "管理中のES", value: stats.totalEs, unit: "通", tint: "#a78bfa", subtle: "Careoで記録されたES総数" },
    { label: "記録された面接", value: stats.totalInterviews, unit: "回", tint: "#f472b6", subtle: "本選考・インターン含む" },
    { label: "獲得した内定・合格", value: stats.totalOffers, unit: "件", tint: ACCENT_DEEP, subtle: "Careoユーザーの実績" },
    { label: "紹介でつながったユーザー", value: stats.totalReferrals, unit: "件", tint: "#ef4444", subtle: "紹介プログラム経由" },
  ] : [];

  return (
    <div className="min-h-screen font-zen-kaku py-8 md:py-14 px-4" style={{ background: BG, color: INK }}>
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-6">
          ← トップに戻る
        </Link>

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style={{ background: `${ACCENT}18`, color: ACCENT_DEEP }}>
            <span className="relative inline-flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: ACCENT }} />
              <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: ACCENT }} />
            </span>
            <span className="text-xs font-bold">BUILD IN PUBLIC · LIVE</span>
          </div>
          <h1 className="font-klee text-3xl md:text-5xl font-bold leading-tight mb-3">
            Careoの全データを<br /><span style={{ color: ACCENT_DEEP }}>リアルタイム公開</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl">
            開発者は28卒の学生1人。プロダクトの透明性を信じて、ユーザー数・Pro加入・蓄積データをすべて公開しています。1時間ごとに自動更新。
          </p>
        </div>

        {!stats && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
            <p className="text-sm text-amber-900">データを取得できませんでした。しばらく経ってから再読み込みしてください。</p>
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
              {cards.map((c) => (
                <div
                  key={c.label}
                  className="bg-white rounded-2xl p-5 md:p-6"
                  style={{ border: "1px solid rgba(13,11,33,0.06)", boxShadow: "0 2px 8px rgba(13,11,33,0.04)" }}
                >
                  <p className="text-[11px] md:text-xs font-semibold text-gray-500 mb-2">{c.label}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl md:text-4xl font-black font-klee" style={{ color: c.tint }}>
                      {c.value.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">{c.unit}</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-gray-400">{c.subtle}</p>
                </div>
              ))}
            </div>

            {/* 今月の数字 */}
            <div className="bg-[#0D0B21] text-white rounded-3xl p-6 md:p-8 mb-8">
              <p className="text-[11px] font-bold text-[#00c896] tracking-[0.2em] uppercase mb-3">📊 今月のハイライト</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                  <span>累計 {stats.totalUsers.toLocaleString()}人のユーザーが Careo を利用中</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                  <span>平均で1人あたり {stats.totalUsers > 0 ? (stats.activeCompanies / stats.totalUsers).toFixed(1) : 0}社 を登録・管理</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                  <span>総{stats.totalEs.toLocaleString()}通のES・{stats.totalInterviews.toLocaleString()}回の面接がログ化されている</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 mb-8" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
              <p className="text-[11px] font-bold text-[#00a87e] tracking-[0.2em] uppercase mb-3">✍️ なぜ全公開するのか</p>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                <p className="mb-3">Careoは個人開発です。私（28卒の大学生）が自分の就活で「こういうツールが欲しかった」を形にしています。</p>
                <p className="mb-3">大手就活サイトの広告モデルや内定者課金のような、学生から搾取する形は避けたい。その代わり、<b>プロダクトが本当に使われているのか・どう成長しているのか</b> を包み隠さず出す方針です。</p>
                <p>もし気に入ったら使ってみてください。合わなかったら正直にフィードバックをもらえると嬉しいです。</p>
              </div>
            </div>
          </>
        )}

        <div className="text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-xl text-white text-[15px]"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
              boxShadow: `0 8px 24px ${ACCENT}55`,
              textDecoration: "none",
            }}
          >
            無料で Careo を始める →
          </Link>
          <p className="text-xs text-gray-400 mt-3">登録30秒 · クレカ不要 · 完全無料</p>
        </div>
      </div>
    </div>
  );
}
