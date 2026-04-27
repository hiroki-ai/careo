"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CareoKun } from "./CareoKun";
import {
  STUDENT_FEATURES,
  STUDENT_DAY,
  STUDENT_WORRIES,
  CAREO_TRAITS,
  BEFORE_AFTER_SCENES,
  UNIVERSITY_MARQUEE,
} from "./studentContent";
import type { RecentPost, UserReview } from "@/app/page";

type Props = {
  recentPosts: RecentPost[];
  userCount: number;
  reviews: UserReview[];
};

const ACCENT = "#00c896";
const ACCENT_DEEP = "#00a87e";
const INK = "#0D0B21";
const BG = "#fcfbf8";
const SURFACE = "#f5f3ee";

function formatUserCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k+`;
  if (n >= 100) return `${n}+`;
  return "28卒向け";
}

export function LandingPage({ recentPosts, userCount, reviews }: Props) {
  void reviews;
  const search = useSearchParams();
  const refId = search?.get("ref") ?? null;
  const showSharedBanner = Boolean(refId);

  // 紹介コードをlocalStorageに保存（signup時に送信される）
  useEffect(() => {
    if (refId) {
      try { localStorage.setItem("careo_referral_code", refId); } catch { /* ignore */ }
    }
  }, [refId]);

  return (
    <div className="font-zen-kaku" style={{ background: BG, color: INK, minHeight: "100%" }}>
      {showSharedBanner && <SharedByFriendBanner />}
      <Header />
      <Hero userCount={userCount} />
      <SocialProofStrip />
      <WhatsNewSection />
      <SummerInternTeaser />
      <BeforeAfterScenes />
      <DailyWithCareo />
      <FeatureGrid />
      <ComingSoonSection />
      <WorriesChat />
      <CleanPromise />
      <PricingSection />
      {/* StudentVoices: 実レビューが一定数集まったら復活（現在は非表示）*/}
      {recentPosts.length > 0 && <RecentPostsSection recentPosts={recentPosts} />}
      <BuiltByStudent />
      <FinalCTA />
    </div>
  );
}

function SharedByFriendBanner() {
  return (
    <div
      className="relative flex items-center justify-center gap-2 overflow-hidden"
      style={{
        background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DEEP})`,
        color: "white",
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 600,
        textAlign: "center",
      }}
    >
      <span className="fs-chip-shimmer absolute inset-0" />
      <span style={{ position: "relative" }}>💌</span>
      <span style={{ position: "relative" }}>
        <b>友達</b>があなたにこのページをシェアしました
      </span>
    </div>
  );
}

function Header() {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: `${BG}ee`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,.05)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: "12px 20px", maxWidth: 1160, margin: "0 auto" }}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <CareoKun size={32} mood="cheer" />
          <span className="font-klee" style={{ fontWeight: 700, fontSize: 22, letterSpacing: 0.5 }}>
            Careo
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden md:inline-flex items-center"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: INK,
              padding: "9px 10px",
              textDecoration: "none",
            }}
          >
            ログイン
          </Link>
          <Link
            href="/signup"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
              color: "white",
              fontWeight: 700,
              padding: "9px 18px",
              borderRadius: 999,
              fontSize: 13,
              boxShadow: `0 4px 14px ${ACCENT}55`,
              textDecoration: "none",
            }}
          >
            はじめる
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero({ userCount }: { userCount: number }) {
  const chipLabel = `${formatUserCount(userCount)}の28卒が使ってる`;

  return (
    <section className="relative overflow-hidden px-4 pt-7 pb-10 md:px-5 md:pt-11 md:pb-14">
      <div
        className="absolute pointer-events-none"
        style={{
          top: 40,
          right: -60,
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${ACCENT}22, transparent 65%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          left: -80,
          width: 280,
          height: 280,
          background: "radial-gradient(circle, rgba(255,200,100,.2), transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="relative grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6 md:gap-9 items-center"
        style={{ maxWidth: 1160, margin: "0 auto" }}
      >
        <div>
          <div
            className="inline-flex items-center gap-2"
            style={{
              padding: "7px 14px",
              background: "white",
              border: `1px solid ${ACCENT}44`,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              color: ACCENT_DEEP,
              marginBottom: 22,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: ACCENT,
                animation: "fs-typing-dot 1.6s infinite",
              }}
            />
            {chipLabel}
          </div>

          <h1
            className="font-klee"
            style={{
              fontSize: "min(10vw, 56px)",
              fontWeight: 600,
              lineHeight: 1.18,
              letterSpacing: -0.8,
              marginBottom: 16,
            }}
          >
            就活の
            <span style={{ color: ACCENT_DEEP }}>勝ち方</span>
            を、
            <br />
            データで見える化。
          </h1>

          <p className="text-[15px] md:text-base leading-[1.8] md:leading-[1.9]" style={{ color: "#4b5563", marginBottom: 22, maxWidth: 520 }}>
            <b style={{ color: INK }}>ES・面接・OB訪問を全部ひとつに。</b>
            通過率もボトルネックも自動で可視化。
            <br />
            AIコーチ「カレオ」が君のデータから、<b style={{ color: INK }}>今週やるべきことTOP3</b>を提案する、就活専用のCRM。
          </p>

          <div className="flex flex-wrap gap-2.5" style={{ marginBottom: 24 }}>
            <Link
              href="/signup"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
                color: "white",
                fontWeight: 800,
                padding: "15px 28px",
                borderRadius: 12,
                fontSize: 15,
                boxShadow: `0 8px 24px ${ACCENT}55`,
                textDecoration: "none",
              }}
            >
              無料ではじめる →
            </Link>
            <Link
              href="/diagnosis"
              style={{
                background: "white",
                color: INK,
                fontWeight: 700,
                padding: "15px 24px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              3分で就活タイプ診断 →
            </Link>
          </div>

          <div
            className="flex flex-wrap items-center gap-4"
            style={{ fontSize: 12, color: "#6b7280" }}
          >
            <span>✓ 無料プランあり</span>
            <span>✓ 登録30秒</span>
            <span>✓ 大学メール不要</span>
          </div>
        </div>

        <div className="relative flex justify-center pt-2 md:pt-2">
          <div className="animate-float absolute" style={{ top: -14, right: "16%", zIndex: 3 }}>
            <CareoKun size={72} mood="cheer" />
          </div>
          <div
            className="absolute"
            style={{
              top: 40,
              left: "8%",
              zIndex: 3,
              background: "white",
              padding: "8px 12px",
              borderRadius: 999,
              border: `1px solid ${ACCENT}44`,
              fontSize: 11,
              fontWeight: 700,
              color: ACCENT_DEEP,
              boxShadow: "0 6px 20px rgba(0,0,0,.08)",
              animation: "fs-pop 0.6s 0.4s both",
            }}
          >
            ● LIVE
          </div>
          <PhoneMockup>
            <DashboardScreen />
          </PhoneMockup>
        </div>
      </div>
    </section>
  );
}

function SummerInternTeaser() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const targetYear = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();

  // 見やすいサンプル（LPは静的なのでDB呼び出しせず、代表企業を固定表示）
  const highlight = [
    { name: "マッキンゼー", industry: "戦略コンサル", deadline: "5月上旬" },
    { name: "ゴールドマン・サックス", industry: "外資投資銀行", deadline: "5月中旬" },
    { name: "三菱商事", industry: "総合商社", deadline: "6月中旬" },
    { name: "電通", industry: "広告", deadline: "6月中旬" },
    { name: "リクルート", industry: "HR・Web", deadline: "6月中旬" },
    { name: "楽天グループ", industry: "国内IT", deadline: "6月下旬" },
  ];

  return (
    <section style={{ padding: "56px 20px 64px", background: "white", borderTop: "1px solid rgba(0,0,0,.04)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-2" style={{ background: `${ACCENT}18`, color: ACCENT_DEEP, fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>
              <span className="relative inline-flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: ACCENT }} />
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: ACCENT }} />
              </span>
              <span>LIVE · 毎週月曜に自動更新</span>
            </div>
            <h2 className="font-klee" style={{ fontSize: "min(8vw, 32px)", fontWeight: 600, letterSpacing: -0.6, lineHeight: 1.25 }}>
              {targetYear}年{month <= 7 ? " · サマーインターン" : " · 秋冬インターン"}締切、<br className="sm:hidden" />
              <span style={{ color: ACCENT_DEEP }}>見逃すな。</span>
            </h2>
            <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>
              主要36社の締切を AI が自動リサーチ。毎週月曜に最新版に更新。
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,.06)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px" style={{ background: "#f3f4f6" }}>
            {highlight.map((c) => (
              <div key={c.name} className="bg-white p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>{c.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT_DEEP, background: `${ACCENT}12`, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    {c.deadline}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "#9ca3af" }}>{c.industry}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center mt-5">
          <Link
            href="/summer-intern"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
              color: "white",
              fontWeight: 800,
              padding: "12px 28px",
              borderRadius: 999,
              fontSize: 14,
              boxShadow: `0 8px 24px ${ACCENT}55`,
              textDecoration: "none",
            }}
          >
            全36社の締切を見る →
          </Link>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="lp-phone-mockup">
      <div className="lp-phone-mockup-frame">
        <div className="lp-phone-mockup-screen">
          <div className="lp-phone-mockup-notch" />
          {children}
        </div>
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div
      style={{
        padding: 0,
        background: "#fafaf7",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ステータスバー風のヘッダー */}
      <div
        className="flex items-center gap-2.5"
        style={{
          padding: "28px 14px 10px",
          background: "white",
          borderBottom: "1px solid rgba(0,0,0,.05)",
        }}
      >
        <CareoKun size={30} mood="cheer" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>おかえり、</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: INK }}>今日やること 3件</div>
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            background: `${ACCENT}18`,
            color: ACCENT_DEEP,
            padding: "3px 8px",
            borderRadius: 999,
          }}
        >
          28卒
        </div>
      </div>

      {/* KPIカード（3つ） */}
      <div style={{ padding: "12px 12px 8px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
        {[
          { label: "応募", value: "12", tint: "#60a5fa", bg: "rgba(96,165,250,.1)" },
          { label: "ES通過", value: "67%", tint: ACCENT_DEEP, bg: `${ACCENT}14` },
          { label: "内定", value: "2", tint: "#f59e0b", bg: "rgba(245,158,11,.12)" },
        ].map((k) => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 10, padding: "8px 8px 6px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#6b7280" }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: k.tint, lineHeight: 1 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* 今週やること */}
      <div style={{ padding: "6px 12px 4px" }}>
        <div
          className="flex items-center gap-1.5"
          style={{ fontSize: 10, fontWeight: 800, color: "#6b7280", letterSpacing: 1, marginBottom: 6 }}
        >
          <span style={{ width: 3, height: 10, background: ACCENT, borderRadius: 2 }} />
          今週やること
        </div>
        {[
          { label: "サマーインターン3社のES提出", tag: "緊急", tint: "#ef4444", bg: "rgba(239,68,68,.08)" },
          { label: "A社1次面接の振り返りログ", tag: "推奨", tint: "#f59e0b", bg: "rgba(245,158,11,.08)" },
          { label: "B社 企業研究（OB訪問予定）", tag: "情報", tint: "#3b82f6", bg: "rgba(59,130,246,.08)" },
        ].map((t) => (
          <div
            key={t.label}
            className="flex items-start gap-2"
            style={{
              background: t.bg,
              borderRadius: 10,
              padding: "7px 9px",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 11,
                height: 11,
                border: "1.5px solid #cbd5e1",
                borderRadius: 3,
                background: "white",
                marginTop: 1,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, fontSize: 10, fontWeight: 700, color: INK, lineHeight: 1.35 }}>{t.label}</div>
            <span style={{ fontSize: 8, fontWeight: 900, color: t.tint, flexShrink: 0, marginTop: 1 }}>{t.tag}</span>
          </div>
        ))}
      </div>

      {/* 選考パイプライン */}
      <div style={{ padding: "4px 12px 10px" }}>
        <div
          className="flex items-center gap-1.5"
          style={{ fontSize: 10, fontWeight: 800, color: "#6b7280", letterSpacing: 1, marginBottom: 6 }}
        >
          <span style={{ width: 3, height: 10, background: "#a78bfa", borderRadius: 2 }} />
          選考パイプライン
        </div>
        <div style={{ background: "white", borderRadius: 10, padding: "8px 10px", border: "1px solid rgba(0,0,0,.04)" }}>
          {[
            { stage: "書類", count: 3, color: "#60a5fa" },
            { stage: "1次面接", count: 4, color: "#a78bfa" },
            { stage: "最終", count: 2, color: "#f472b6" },
            { stage: "内定", count: 2, color: ACCENT },
          ].map((s) => (
            <div key={s.stage} className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#6b7280", width: 48, flexShrink: 0 }}>{s.stage}</div>
              <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(s.count * 20, 100)}%`, height: "100%", background: s.color, borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: INK, width: 18, textAlign: "right" }}>{s.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CleanPromise() {
  const items = [
    { icon: "🚫", title: "スカウト・電話一切なし", body: "人材会社への登録や営業電話は絶対に発生しません。" },
    { icon: "💾", title: "データを1円にも換金しない", body: "入力データを広告主・人材会社・第三者に売ることはありません。あなたの成長のためだけに使います。" },
    { icon: "🛡", title: "学生だけを向いた設計", body: "Careoの顧客はあなた（学生）です。企業側の都合で設計を曲げることはありません。" },
  ];
  return (
    <section style={{ padding: "72px 20px 40px", background: BG }}>
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: ACCENT_DEEP, fontWeight: 800, letterSpacing: 3, marginBottom: 10 }}>
          OUR PROMISE
        </p>
        <h2 className="font-klee" style={{ fontSize: "min(8vw, 32px)", fontWeight: 600, letterSpacing: -0.6, marginBottom: 10, lineHeight: 1.35 }}>
          「売らない」宣言
        </h2>
        <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.9, maxWidth: 560, margin: "0 auto 28px" }}>
          就活サービスの多くは「学生＝商材」として企業に情報を売ることで成立しています。Careoは違います。
        </p>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {items.map((it) => (
            <div
              key={it.title}
              style={{
                background: "white",
                border: "1px solid rgba(0,0,0,.06)",
                borderRadius: 18,
                padding: 20,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{it.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 6 }}>{it.title}</p>
              <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.75 }}>{it.body}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 20 }}>
          詳細は <Link href="/privacy" style={{ color: ACCENT_DEEP, textDecoration: "underline" }}>プライバシーポリシー</Link> と <Link href="/terms" style={{ color: ACCENT_DEEP, textDecoration: "underline" }}>利用規約</Link> をご覧ください
        </p>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section style={{ padding: "72px 20px 64px", background: SURFACE }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p style={{ fontSize: 11, color: ACCENT_DEEP, fontWeight: 800, letterSpacing: 3, marginBottom: 10 }}>
            PRICING
          </p>
          <h2 className="font-klee" style={{ fontSize: "min(8vw, 34px)", fontWeight: 600, letterSpacing: -0.6, marginBottom: 12, lineHeight: 1.3 }}>
            学生に、無理のない価格で。
          </h2>
          <p style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.9, maxWidth: 520, margin: "0 auto" }}>
            基本機能は全部無料。データが貯まるほど精度が上がる分析だけを、有料プランで。
          </p>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {/* Free */}
          <div style={{ background: "white", border: "1px solid rgba(0,0,0,.06)", borderRadius: 20, padding: 26 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>Free</span>
              <span style={{ fontSize: 10, fontWeight: 700, background: "#f3f4f6", color: "#6b7280", padding: "2px 8px", borderRadius: 999 }}>
                永久無料
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 14 }}>
              <span style={{ fontSize: 34, fontWeight: 900, color: INK, lineHeight: 1 }}>¥0</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>/ 無期限</span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                "企業・ES・面接ログ管理（無制限）",
                "締切カレンダー・日程自動収集",
                "基本KPIダッシュボード",
                "今週やること提案（月2回）",
                "PDCA分析（月1回）",
                "横断インサイト（月1回）",
                "広告表示あり",
              ].map((f) => (
                <li key={f} className="flex items-start gap-1.5" style={{ fontSize: 12, color: "#4b5563" }}>
                  <span style={{ color: ACCENT_DEEP, marginTop: 1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 18,
                padding: "11px",
                background: "white",
                border: `1.5px solid ${ACCENT}`,
                color: ACCENT_DEEP,
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              無料ではじめる
            </Link>
          </div>

          {/* Pro */}
          <div style={{ background: "white", border: `2px solid ${ACCENT}`, borderRadius: 20, padding: 26, position: "relative", boxShadow: `0 20px 48px -20px ${ACCENT}55` }}>
            <div
              style={{
                position: "absolute",
                top: -10,
                right: 18,
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
                color: "white",
                fontSize: 10,
                fontWeight: 900,
                padding: "4px 10px",
                borderRadius: 999,
                letterSpacing: 1,
              }}
            >
              推奨
            </div>
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: INK }}>Pro</span>
              <span style={{ fontSize: 10, fontWeight: 800, background: `${ACCENT}18`, color: ACCENT_DEEP, padding: "2px 8px", borderRadius: 999 }}>
                年払いで41%OFF
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 2 }}>
              <span style={{ fontSize: 34, fontWeight: 900, color: INK, lineHeight: 1 }}>¥480</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>/ 月</span>
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 14 }}>
              年払い ¥2,800 （月換算 ¥233）
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 7 }}>
              {[
                "Freeプランの全機能",
                "今週やること提案 無制限（週1自動）",
                "PDCA深掘り分析 無制限",
                "横断インサイト 無制限",
                "週次コーチレポート",
                "業界別勝ちパターン分析",
                "KPIダッシュボード全業界表示",
                "広告非表示",
              ].map((f) => (
                <li key={f} className="flex items-start gap-1.5" style={{ fontSize: 12, color: "#111827" }}>
                  <span style={{ color: ACCENT_DEEP, marginTop: 1 }}>★</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 18,
                padding: "11px",
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
                color: "white",
                borderRadius: 12,
                fontWeight: 900,
                fontSize: 13,
                textDecoration: "none",
                boxShadow: `0 8px 20px ${ACCENT}44`,
              }}
            >
              登録してProを試す →
            </Link>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", marginTop: 18 }}>
          いつでも解約できます · クレジットカード決済（Stripe）
        </p>
      </div>
    </section>
  );
}

function SocialProofStrip() {
  const rows = [...UNIVERSITY_MARQUEE, ...UNIVERSITY_MARQUEE, ...UNIVERSITY_MARQUEE];
  return (
    <section
      style={{
        padding: "24px 0",
        background: "white",
        borderTop: "1px solid rgba(0,0,0,.04)",
        borderBottom: "1px solid rgba(0,0,0,.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize: 10,
          fontWeight: 700,
          color: "#9ca3af",
          letterSpacing: 3,
          marginBottom: 12,
        }}
      >
        MEMBERS FROM
      </div>
      <div className="flex whitespace-nowrap animate-ticker" style={{ gap: 32 }}>
        {rows.map((u, i) => (
          <span
            key={i}
            className="font-klee"
            style={{ fontSize: 16, fontWeight: 600, color: "#1f2937", flexShrink: 0 }}
          >
            {u}
          </span>
        ))}
      </div>
    </section>
  );
}

function CareoPersonality() {
  return (
    <section style={{ padding: "56px 20px", background: SURFACE }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p
            style={{
              fontSize: 11,
              color: ACCENT_DEEP,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 10,
            }}
          >
            MEET CAREO
          </p>
          <h2
            className="font-klee"
            style={{
              fontSize: "min(8vw, 34px)",
              fontWeight: 600,
              letterSpacing: -0.6,
              marginBottom: 14,
              lineHeight: 1.3,
            }}
          >
            カレオってこんなAIです
          </h2>
          <p
            style={{
              fontSize: 13.5,
              color: "#6b7280",
              lineHeight: 1.9,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Anthropic の Claude をベースに、就活専用にチューニング。
            <br />
            就活生の気持ちを理解するように育てました。
          </p>
        </div>

        <div
          className="grid gap-3.5 items-stretch"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
        >
          <div
            className="flex flex-col items-center text-center"
            style={{
              background: `linear-gradient(160deg, ${ACCENT}18, ${ACCENT}04)`,
              border: `1px solid ${ACCENT}33`,
              borderRadius: 20,
              padding: 24,
            }}
          >
            <CareoKun size={96} mood="cheer" />
            <div className="font-klee" style={{ fontSize: 20, fontWeight: 700, marginTop: 12 }}>
              カレオ
            </div>
            <div style={{ fontSize: 11, color: ACCENT_DEEP, fontWeight: 700, marginTop: 4 }}>
              AI就活コーチ
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                lineHeight: 1.7,
                marginTop: 12,
                padding: "10px 12px",
                background: "white",
                borderRadius: 12,
                width: "100%",
              }}
            >
              <div>
                <b>年齢</b> 永遠の25卒
              </div>
              <div>
                <b>好き</b> 君の成長を見ること
              </div>
              <div>
                <b>苦手</b> 比較で焦らせること
              </div>
            </div>
          </div>

          {CAREO_TRAITS.map((t) => (
            <div
              key={t.label}
              className="flex flex-col gap-2.5"
              style={{
                background: "white",
                borderRadius: 20,
                border: "1px solid rgba(0,0,0,.05)",
                padding: 22,
              }}
            >
              <div style={{ fontSize: 32, lineHeight: 1, marginBottom: 4 }}>{t.emoji}</div>
              <div
                className="font-klee"
                style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}
              >
                {t.label}
              </div>
              <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.8, margin: 0 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterScenes() {
  return (
    <section style={{ padding: "64px 20px", background: "white" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p
            style={{
              fontSize: 11,
              color: ACCENT_DEEP,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 10,
            }}
          >
            BEFORE / AFTER
          </p>
          <h2
            className="font-klee"
            style={{
              fontSize: "min(8vw, 34px)",
              fontWeight: 600,
              letterSpacing: -0.6,
              lineHeight: 1.3,
            }}
          >
            こんな瞬間に、カレオは隣にいる
          </h2>
        </div>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {BEFORE_AFTER_SCENES.map((s) => (
            <div
              key={s.when}
              style={{
                background: SURFACE,
                borderRadius: 20,
                border: "1px solid rgba(0,0,0,.05)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  background: INK,
                  color: "white",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                }}
              >
                📍 {s.when}
              </div>
              <div style={{ padding: "18px 16px" }}>
                <div
                  className="flex gap-2.5"
                  style={{
                    marginBottom: 14,
                    paddingBottom: 14,
                    borderBottom: "1px dashed rgba(0,0,0,.12)",
                  }}
                >
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{s.before.mood}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#9ca3af",
                        letterSpacing: 2,
                        marginBottom: 4,
                      }}
                    >
                      BEFORE
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: "#4b5563",
                        margin: 0,
                        fontStyle: "italic",
                      }}
                    >
                      「{s.before.thought}」
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{s.after.mood}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: ACCENT_DEEP,
                        letterSpacing: 2,
                        marginBottom: 4,
                      }}
                    >
                      AFTER
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        lineHeight: 1.7,
                        color: INK,
                        margin: 0,
                        fontWeight: 500,
                      }}
                    >
                      「{s.after.thought}」
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DailyWithCareo() {
  return (
    <section style={{ padding: "56px 20px", background: SURFACE }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p
            style={{
              fontSize: 11,
              color: ACCENT_DEEP,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 10,
            }}
          >
            1 DAY WITH CAREO
          </p>
          <h2
            className="font-klee"
            style={{
              fontSize: "min(8vw, 32px)",
              fontWeight: 600,
              letterSpacing: -0.6,
              lineHeight: 1.3,
            }}
          >
            カレオがいる、ふつうの1日
          </h2>
        </div>
        <div className="grid gap-2.5">
          {STUDENT_DAY.map((d) => (
            <div
              key={d.time}
              className="grid items-center gap-3.5"
              style={{
                gridTemplateColumns: "56px 1fr auto",
                padding: "16px 18px",
                background: "white",
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,.04)",
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  width: 44,
                  height: 44,
                  background: SURFACE,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {d.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800 }}>{d.t}</div>
                <div style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.6, marginTop: 2 }}>
                  {d.d}
                </div>
              </div>
              <span
                className="font-klee"
                style={{ fontSize: 15, fontWeight: 700, color: ACCENT_DEEP }}
              >
                {d.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section style={{ padding: "56px 20px", background: "white" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p
            style={{
              fontSize: 11,
              color: ACCENT_DEEP,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 10,
            }}
          >
            FEATURES
          </p>
          <h2
            className="font-klee"
            style={{
              fontSize: "min(8vw, 34px)",
              fontWeight: 600,
              letterSpacing: -0.6,
              lineHeight: 1.3,
            }}
          >
            就活のぜんぶ、<span style={{ color: ACCENT_DEEP }}>ここで完結</span>
          </h2>
        </div>
        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
        >
          {STUDENT_FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3.5"
              style={{
                background: SURFACE,
                borderRadius: 18,
                padding: 22,
                border: "1px solid rgba(0,0,0,.05)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${ACCENT}1a`,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {f.icon}
              </div>
              <div style={{ flex: 1 }}>
                <h3 className="font-klee" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.7, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorriesChat() {
  return (
    <section style={{ padding: "56px 20px", background: SURFACE }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p
            style={{
              fontSize: 11,
              color: ACCENT_DEEP,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 10,
            }}
          >
            WORRIES
          </p>
          <h2
            className="font-klee"
            style={{
              fontSize: "min(8vw, 30px)",
              fontWeight: 600,
              letterSpacing: -0.6,
              lineHeight: 1.4,
            }}
          >
            もし、こんなことで悩んでいたら
          </h2>
        </div>
        <div className="flex flex-col gap-4">
          {STUDENT_WORRIES.map((w, i) => (
            <div key={w.q}>
              <div className="flex justify-end" style={{ marginBottom: 8 }}>
                <div
                  style={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "18px 18px 4px 18px",
                    padding: "10px 16px",
                    fontSize: 14,
                    maxWidth: "85%",
                    color: "#374151",
                  }}
                >
                  {w.q}
                </div>
              </div>
              <div className="flex items-end gap-2">
                <CareoKun size={36} mood={i % 2 ? "think" : "cheer"} />
                <div
                  style={{
                    background: ACCENT,
                    color: "white",
                    borderRadius: "18px 18px 18px 4px",
                    padding: "10px 16px",
                    fontSize: 14,
                    maxWidth: "85%",
                    lineHeight: 1.7,
                    boxShadow: `0 4px 14px ${ACCENT}44`,
                  }}
                >
                  {w.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudentVoices({
  reviews,
  userCount,
}: {
  reviews: ReadonlyArray<UserReview>;
  userCount: number;
}) {
  void userCount;
  // 平均レート計算（実レビューのみ、1件もなければ表示しない）
  const avg = reviews.length > 0
    ? reviews.reduce((s, r) => s + (r.rating ?? 5), 0) / reviews.length
    : null;
  return (
    <section style={{ padding: "56px 20px", background: "white" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <p
            style={{
              fontSize: 11,
              color: ACCENT_DEEP,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 10,
            }}
          >
            VOICES
          </p>
          <h2
            className="font-klee"
            style={{
              fontSize: "min(8vw, 34px)",
              fontWeight: 600,
              letterSpacing: -0.6,
              marginBottom: 10,
              lineHeight: 1.3,
            }}
          >
            使っている学生の声
          </h2>
          {avg !== null && (
            <div style={{ fontSize: 12.5, color: "#6b7280" }}>
              <span style={{ color: "#f59e0b", fontSize: 14, letterSpacing: 2 }}>★★★★★</span>
              <span style={{ marginLeft: 8 }}>{avg.toFixed(1)} / 5.0 （{reviews.length}件）</span>
            </div>
          )}
        </div>
        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                background: SURFACE,
                borderRadius: 18,
                padding: 20,
                border: "1px solid rgba(0,0,0,.04)",
              }}
            >
              <div
                style={{
                  color: "#f59e0b",
                  fontSize: 13,
                  letterSpacing: 2,
                  marginBottom: 10,
                }}
              >
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </div>
              <p
                className="font-klee"
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.85,
                  marginBottom: 14,
                  color: "#1f2937",
                }}
              >
                「{r.quote}」
              </p>
              <div
                className="flex items-center gap-2.5"
                style={{ paddingTop: 12, borderTop: "1px solid rgba(0,0,0,.05)" }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: `${ACCENT}22`,
                    color: ACCENT_DEEP,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {r.display_name[0]}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>
                    {r.display_name}{" "}
                    <span style={{ color: "#9ca3af", fontWeight: 500 }}>· {r.university ?? ""}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecentPostsSection({ recentPosts }: { recentPosts: RecentPost[] }) {
  return (
    <section style={{ padding: "56px 20px", background: SURFACE }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div
          className="flex flex-wrap justify-between items-baseline gap-2.5"
          style={{ marginBottom: 24 }}
        >
          <h2
            className="font-klee"
            style={{ fontSize: "min(6.5vw, 26px)", fontWeight: 600, letterSpacing: -0.4 }}
          >
            最新の就活ヒント
          </h2>
          <Link
            href="/blog"
            style={{ fontSize: 12, color: ACCENT_DEEP, fontWeight: 700, textDecoration: "none" }}
          >
            すべて見る →
          </Link>
        </div>
        <div
          className="grid gap-3.5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
        >
          {recentPosts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              style={{
                display: "block",
                background: "white",
                borderRadius: 14,
                padding: 18,
                border: "1px solid rgba(0,0,0,.04)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div className="flex flex-wrap gap-1.5" style={{ marginBottom: 10 }}>
                {p.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: ACCENT_DEEP,
                      background: `${ACCENT}14`,
                      padding: "3px 8px",
                      borderRadius: 999,
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <h3
                className="font-klee"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1.55,
                  marginBottom: 12,
                  letterSpacing: -0.2,
                  color: INK,
                }}
              >
                {p.title}
              </h3>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>
                📖 {p.reading_time_min}分で読める
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuiltByStudent() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ padding: "56px 20px", background: INK, color: "white" }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          right: 0,
          width: 320,
          height: 320,
          background: `radial-gradient(circle, ${ACCENT}22, transparent 65%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        className="relative flex flex-wrap items-center justify-center gap-7"
        style={{ maxWidth: 720, margin: "0 auto" }}
      >
        <div style={{ flexShrink: 0 }}>
          <CareoKun size={108} mood="think" />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <p
            style={{
              fontSize: 11,
              color: ACCENT,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 10,
            }}
          >
            BUILT BY A STUDENT, FOR STUDENTS
          </p>
          <h2
            className="font-klee"
            style={{ fontSize: 24, fontWeight: 600, marginBottom: 14, lineHeight: 1.4 }}
          >
            開発者も、
            <br />
            28卒の現役上智大生。
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,.75)",
              lineHeight: 1.9,
              margin: 0,
            }}
          >
            Careoは、開発者自身が就活で「もっとこうだったら」と感じたことから生まれました。
            僕もユーザーのひとりとして、毎日カレオと就活してます。
          </p>
        </div>
      </div>
    </section>
  );
}

function HeroBackdrop({ flip = false }: { flip?: boolean }) {
  return (
    <>
      <div
        className="absolute pointer-events-none"
        style={{
          top: flip ? "auto" : 30,
          bottom: flip ? 0 : "auto",
          right: flip ? "auto" : -60,
          left: flip ? -80 : "auto",
          width: 300,
          height: 300,
          background: `radial-gradient(circle, ${ACCENT}22, transparent 65%)`,
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: flip ? 30 : "auto",
          bottom: flip ? "auto" : 0,
          left: flip ? "auto" : -80,
          right: flip ? -60 : "auto",
          width: 260,
          height: 260,
          background: "radial-gradient(circle, rgba(255,200,100,.2), transparent 65%)",
          filter: "blur(40px)",
        }}
      />
    </>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2"
      style={{
        padding: "7px 14px",
        background: "white",
        border: `1px solid ${ACCENT}44`,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: ACCENT_DEEP,
        marginBottom: 16,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: ACCENT,
          animation: "fs-typing-dot 1.6s infinite",
        }}
      />
      {children}
    </div>
  );
}

function WhatsNewSection() {
  const items = [
    {
      tag: "NEW",
      icon: "📅",
      title: "就活専用カレンダー",
      desc: "ES締切・面接・説明会・インターン日程を自動で集約。マイ予定も書き込める「紙のカレンダー」感覚。スワイプで月送り、タップで予定追加。",
    },
    {
      tag: "NEW",
      icon: "🧠",
      title: "コーチングAI（レベル別）",
      desc: "「やり始めたばかり」から「もう20社進めてる」まで、現在地に合わせて深度が変わるコーチ。スターター・直前確認・進捗振り返りの3モード。",
    },
    {
      tag: "RENEWED",
      icon: "✨",
      title: "記録UIをモバイル全面刷新",
      desc: "面接・ES・OB訪問・筆記試験・企業登録の入力フォームをモバイルファーストに再設計。日時ピッカー・自動拡張テキストエリアでスマホでもサクサク。",
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-14 md:px-5 md:py-20" style={{ background: BG }}>
      <HeroBackdrop />
      <div className="relative" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <SectionEyebrow>WHAT&apos;S NEW</SectionEyebrow>
          <h2
            className="font-klee"
            style={{
              fontSize: "min(8vw, 40px)",
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: -0.6,
              margin: 0,
              color: INK,
            }}
          >
            アップデート、<span style={{ color: ACCENT_DEEP }}>続々。</span>
            <br />
            就活生の声から生まれた新機能。
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {items.map((it) => (
            <div
              key={it.title}
              style={{
                background: "white",
                borderRadius: 20,
                padding: 24,
                border: `1px solid ${ACCENT}1a`,
                boxShadow: `0 8px 24px ${ACCENT}10`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{it.icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1,
                    background: it.tag === "NEW" ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})` : "#FFB347",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  {it.tag}
                </span>
              </div>
              <h3 className="font-klee" style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", color: INK, letterSpacing: -0.3 }}>
                {it.title}
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: "#4b5563", margin: 0 }}>{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SeniorStackSection() {
  const groups = [
    {
      cat: "みんな入れる枠",
      icon: "📥",
      items: [
        { name: "マイナビ", role: "求人検索・エントリー" },
        { name: "キャリタス就活", role: "合説・スケジュール" },
      ],
    },
    {
      cat: "ES・体験談調べ",
      icon: "📝",
      items: [
        { name: "ワンキャリア", role: "通過ES・面接体験記" },
        { name: "就活会議", role: "選考体験 + 企業評価" },
      ],
    },
    {
      cat: "クチコミ・年収",
      icon: "💼",
      items: [
        { name: "Openwork", role: "現役・元社員のリアル" },
      ],
    },
    {
      cat: "OB/OG訪問",
      icon: "☕",
      items: [
        { name: "ビズリーチ・キャンパス", role: "大学OB/OGマッチング" },
      ],
    },
    {
      cat: "スカウト",
      icon: "✉️",
      items: [
        { name: "キャリアチケット", role: "プロフィール型スカウト" },
        { name: "外資就活ドットコム", role: "外資・日系トップ" },
      ],
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-14 md:px-5 md:py-20" style={{ background: SURFACE }}>
      <HeroBackdrop flip />
      <div className="relative" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <SectionEyebrow>SENIOR&apos;S STACK</SectionEyebrow>
          <h2
            className="font-klee"
            style={{
              fontSize: "min(8vw, 40px)",
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: -0.6,
              margin: 0,
              color: INK,
            }}
          >
            先輩たちが実際に使っていた
            <br />
            <span style={{ color: ACCENT_DEEP }}>定番サービス</span>と組み合わせる。
          </h2>
          <p
            className="text-[14px] md:text-[15px]"
            style={{ color: "#4b5563", marginTop: 14, lineHeight: 1.9, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}
          >
            <b style={{ color: INK }}>Careoは「データ集約のハブ」。</b>
            個別ツールの強みを消さず、出力データをCareoに集めると、AIが横断で次の一手を提案します。
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {groups.map((g) => (
            <div
              key={g.cat}
              style={{
                background: "white",
                borderRadius: 20,
                padding: 20,
                border: `1px solid ${ACCENT}1a`,
                boxShadow: `0 8px 24px ${ACCENT}10`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{g.icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1,
                    color: ACCENT_DEEP,
                    background: `${ACCENT}14`,
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  ☆ {g.cat}
                </span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {g.items.map((it) => (
                  <li key={it.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span className="font-klee" style={{ fontSize: 14, fontWeight: 600, color: INK, letterSpacing: -0.2 }}>
                      {it.name}
                    </span>
                    <span style={{ fontSize: 11, color: "#6b7280", textAlign: "right", lineHeight: 1.5 }}>
                      {it.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: "20px 22px",
            border: `1px solid ${ACCENT}33`,
            boxShadow: `0 12px 32px ${ACCENT}1a`,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <p
            className="font-klee"
            style={{
              fontSize: 16,
              fontWeight: 600,
              margin: 0,
              color: INK,
              letterSpacing: -0.3,
            }}
          >
            💡 結論：1サービスでは戦えない。<span style={{ color: ACCENT_DEEP }}>Careoが集める。</span>
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.9, color: "#4b5563", margin: 0 }}>
            マイナビで応募 → ワンキャリアで予習 → ビズリーチ・キャンパスでOB訪問 → Openworkで内部情報。
            この流れで集まる情報を <b style={{ color: INK }}>Careoに一元化</b> すると、AIが「次にやるべきこと」を自動で提示します。
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/compare"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
                color: "white",
                fontWeight: 800,
                padding: "12px 22px",
                borderRadius: 12,
                fontSize: 14,
                boxShadow: `0 8px 20px ${ACCENT}55`,
                textDecoration: "none",
              }}
            >
              詳しい比較を見る →
            </Link>
            <Link
              href="/blog/shukatsu-services-comparison-2026"
              style={{
                background: "white",
                color: INK,
                fontWeight: 700,
                padding: "12px 18px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              比較ブログを読む →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComingSoonSection() {
  const items = [
    {
      icon: "📧",
      title: "Gmail連携",
      desc: "企業からのメールを自動で企業ごとに仕分け。「次にやるべきこと」をAIが提案。",
      eta: "近日公開",
    },
    {
      icon: "💼",
      title: "Careo for 転職",
      desc: "新卒で築いたCareoのノウハウを、転職市場に。在籍企業・職務経歴ベースのキャリアコーチング。",
      eta: "別サイトで準備中",
    },
    {
      icon: "📱",
      title: "iOS / Android アプリ",
      desc: "プッシュ通知でES締切や面接前日のリマインドを。アプリストアにて準備中。",
      eta: "近日リリース",
    },
  ];

  return (
    <section className="relative overflow-hidden px-4 py-14 md:px-5 md:py-20" style={{ background: BG }}>
      <HeroBackdrop />
      <div className="relative" style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <SectionEyebrow>COMING SOON</SectionEyebrow>
          <h2
            className="font-klee"
            style={{
              fontSize: "min(7.5vw, 36px)",
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: -0.6,
              margin: 0,
              color: INK,
            }}
          >
            これから来る、<span style={{ color: ACCENT_DEEP }}>アップデート。</span>
          </h2>
          <p style={{ fontSize: 14, color: "#4b5563", marginTop: 14, lineHeight: 1.9 }}>
            Careoは、就活生のリアルな声からアップデートが生まれるプロダクトです。
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {items.map((it) => (
            <div
              key={it.title}
              style={{
                background: "white",
                borderRadius: 20,
                padding: 22,
                border: `1px dashed ${ACCENT}55`,
                boxShadow: `0 6px 18px ${ACCENT}0a`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{it.icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: ACCENT_DEEP,
                    background: `${ACCENT}15`,
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  {it.eta}
                </span>
              </div>
              <h3 className="font-klee" style={{ fontSize: 17, fontWeight: 600, margin: "0 0 6px", color: INK, letterSpacing: -0.3 }}>
                {it.title}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: "#4b5563", margin: 0 }}>{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "https://careoai.jp";
    const data = {
      title: "Careo — AIコーチ「カレオ」と就活",
      text: "就活、ひとりでやらなくていいんだよ。カレオと一緒にPDCA回してみて。",
      url,
    };
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await navigator.share(data);
        return;
      }
    } catch {
      // fall through to clipboard
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert("URLをコピーしました");
      }
    } catch {
      // noop
    }
  };

  return (
    <section
      className="relative overflow-hidden text-center"
      style={{ padding: "64px 20px 72px", background: "white" }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: -40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 200,
          background: `radial-gradient(circle, ${ACCENT}33, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />
      <div className="relative" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="animate-float" style={{ marginBottom: 16 }}>
          <div style={{ display: "inline-block" }}>
            <CareoKun size={84} mood="celebrate" />
          </div>
        </div>
        <h2
          className="font-klee"
          style={{
            fontSize: "min(10vw, 40px)",
            fontWeight: 600,
            letterSpacing: -0.8,
            marginBottom: 14,
            lineHeight: 1.3,
          }}
        >
          カレオと、
          <br />
          就活はじめよう。
        </h2>
        <p style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 28, lineHeight: 1.8 }}>
          登録30秒・無料プランあり。
          <br />
          まずは「今日やること」から、話しかけてみて。
        </p>
        <div className="flex flex-wrap gap-2.5 justify-center">
          <Link
            href="/signup"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
              color: "white",
              fontWeight: 800,
              padding: "16px 34px",
              borderRadius: 999,
              fontSize: 15,
              boxShadow: `0 8px 24px ${ACCENT}55`,
              textDecoration: "none",
            }}
          >
無料ではじめる →
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2"
            style={{
              background: "white",
              color: INK,
              fontWeight: 700,
              padding: "16px 24px",
              borderRadius: 999,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <span>🔗</span> 友達にシェア
          </button>
        </div>

        <div
          className="flex flex-wrap justify-center items-center gap-5"
          style={{
            marginTop: 36,
            padding: "20px 16px",
            background: SURFACE,
            borderRadius: 16,
            fontSize: 11,
            color: "#6b7280",
          }}
        >
          <div>🔒 データは暗号化保管</div>
          <div>✓ 企業への情報提供なし</div>
          <div>✓ 退会いつでも可</div>
        </div>

        <div
          className="flex flex-wrap justify-center gap-3.5"
          style={{
            marginTop: 36,
            paddingTop: 20,
            borderTop: "1px solid rgba(0,0,0,.06)",
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          <Link href="/privacy" style={{ color: "inherit" }}>
            プライバシー
          </Link>
          <Link href="/terms" style={{ color: "inherit" }}>
            利用規約
          </Link>
          <Link href="/compare" style={{ color: "inherit" }}>
            他サービスとの比較
          </Link>
          <Link href="/diagnosis" style={{ color: "inherit" }}>
            就活タイプ診断
          </Link>
          <Link href="/simulator" style={{ color: "inherit" }}>
            内定確率シミュレータ
          </Link>
          <Link href="/stats" style={{ color: "inherit" }}>
            リアルタイム統計
          </Link>
          <Link href="/story" style={{ color: "inherit" }}>
            開発者ストーリー
          </Link>
          <Link href="/summer-intern" style={{ color: "inherit" }}>
            サマーインターン締切
          </Link>
          <Link href="/glossary" style={{ color: "inherit" }}>
            就活用語辞典
          </Link>
          <a href="mailto:hiroki.abe.career@gmail.com" style={{ color: "inherit" }}>
            お問い合わせ
          </a>
          <span>© 2026 Careo</span>
        </div>
      </div>
    </section>
  );
}
