import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CareoKun } from "@/components/landing/CareoKun";
import type { Metadata } from "next";

export const revalidate = 600; // 10分ごと再生成

const ACCENT = "#00c896";
const ACCENT_DEEP = "#00a87e";
const INK = "#0D0B21";
const BG = "#fcfbf8";

interface PublicProfile {
  username: string;
  university: string;
  faculty: string;
  grade: string;
  graduation_year: number;
  target_industries: string[];
  target_jobs: string[];
  job_search_stage: string;
  public_bio: string | null;
  public_x_handle: string | null;
  public_linkedin_url: string | null;
  companies_count: number;
  offered_count: number;
  es_count: number;
  interview_count: number;
  created_at: string;
}

async function getProfile(username: string): Promise<PublicProfile | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase.rpc("get_public_profile", { p_username: username });
    const row = Array.isArray(data) ? data[0] : data;
    return (row as PublicProfile) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) return { title: "プロフィールが見つかりません | Careo" };
  return {
    title: `${profile.username}さんの就活プロフィール | Careo`,
    description: `${profile.university ? profile.university : ""} ${profile.graduation_year}年卒の${profile.username}さんの就活記録。企業${profile.companies_count}社・ES${profile.es_count}通・面接${profile.interview_count}回をCareoで管理中。`,
    openGraph: {
      title: `${profile.username}さんの就活プロフィール`,
      description: `${profile.graduation_year}年卒・応募${profile.companies_count}社・内定${profile.offered_count}件`,
    },
  };
}

function stageLabel(s: string): string {
  if (s === "not_started") return "これから本格始動";
  if (s === "just_started") return "動き出したところ";
  return "本格的に進行中";
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const signupYears = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365));

  return (
    <div className="min-h-screen font-zen-kaku py-8 md:py-14 px-4" style={{ background: BG, color: INK }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-6">
          ← Careoトップ
        </Link>

        {/* プロフィールヘッダー */}
        <div className="bg-white rounded-3xl p-6 md:p-10 mb-4 relative overflow-hidden" style={{ border: "1px solid rgba(0,200,150,0.15)" }}>
          <div className="absolute pointer-events-none" style={{ top: -40, right: -40, width: 220, height: 220, background: `radial-gradient(circle, ${ACCENT}22, transparent 60%)`, filter: "blur(30px)" }} />
          <div className="relative">
            <div className="flex items-start gap-4 mb-5">
              <div className="shrink-0"><CareoKun size={72} mood="default" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#00a87e]">@{profile.username}</span>
                  <span className="text-[10px] bg-[#00c896]/15 text-[#00a87e] font-bold px-2 py-0.5 rounded-full">
                    Careo Verified
                  </span>
                </div>
                <h1 className="font-klee text-2xl md:text-3xl font-bold mb-1 truncate">
                  {profile.username} の就活記録
                </h1>
                <p className="text-xs text-gray-500">
                  {profile.university ? `${profile.university}` : "大学名非公開"}
                  {profile.faculty ? ` · ${profile.faculty}` : ""}
                  {` · ${profile.graduation_year}年卒`}
                </p>
              </div>
            </div>

            {profile.public_bio && (
              <p className="text-sm text-gray-700 leading-relaxed bg-[#00c896]/5 rounded-2xl p-4 border border-[#00c896]/20 mb-4">
                {profile.public_bio}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500 mb-1">
              <span>📌 {stageLabel(profile.job_search_stage)}</span>
              {signupYears >= 0 && <span>✨ Careoを{signupYears === 0 ? "利用中" : `${signupYears}年利用`}</span>}
            </div>

            {(profile.public_x_handle || profile.public_linkedin_url) && (
              <div className="flex gap-2 mt-3">
                {profile.public_x_handle && (
                  <a
                    href={`https://x.com/${profile.public_x_handle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-black text-white"
                  >
                    𝕏 @{profile.public_x_handle.replace(/^@/, "")}
                  </a>
                )}
                {profile.public_linkedin_url && (
                  <a
                    href={profile.public_linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#0A66C2] text-white"
                  >
                    in LinkedIn
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 就活実績スタッツ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "応募企業数", value: profile.companies_count, tint: "#60a5fa" },
            { label: "管理中のES", value: profile.es_count, tint: "#a78bfa" },
            { label: "記録された面接", value: profile.interview_count, tint: "#f472b6" },
            { label: "内定・合格", value: profile.offered_count, tint: ACCENT_DEEP },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 md:p-5" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
              <p className="text-[10px] md:text-xs font-semibold text-gray-500 mb-1">{s.label}</p>
              <p className="text-2xl md:text-3xl font-black font-klee" style={{ color: s.tint }}>
                {s.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* 志望業界・職種 */}
        {(profile.target_industries.length > 0 || profile.target_jobs.length > 0) && (
          <div className="bg-white rounded-2xl p-5 md:p-6 mb-4" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
            {profile.target_industries.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">志望業界</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.target_industries.map((i) => (
                    <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full bg-[#00c896]/10 text-[#00a87e]">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.target_jobs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">志望職種</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.target_jobs.map((j) => (
                    <span key={j} className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700">
                      {j}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-3xl p-6 md:p-8 text-center" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})` }}>
          <h2 className="font-klee text-xl md:text-2xl font-bold text-white mb-2">
            自分の就活も、<br />
            <span className="underline">Careoで可視化</span>しよう
          </h2>
          <p className="text-white/80 text-xs md:text-sm mb-5">
            ES・面接・OB訪問を一元管理、AIが今週やるべきことを提案する就活専用CRM。
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#00a87e] font-black px-7 py-3.5 rounded-xl text-[15px] shadow-xl"
          >
            無料でCareoを始める →
          </Link>
          <p className="text-white/60 text-[10px] mt-3">登録30秒 · クレカ不要 · 完全無料</p>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6">
          このプロフィールは {profile.username} さんが公開を許可した情報のみ表示しています。
        </p>
      </div>
    </div>
  );
}
