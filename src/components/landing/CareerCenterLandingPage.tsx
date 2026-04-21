"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TRUST_ITEMS,
  OPERATION_ITEMS,
  PAIN_POINTS,
  TIMELINE,
  PRINCIPLES,
  FEATURES,
  SECURITY,
  STEPS,
  FAQS,
} from "./careerCenterContent";

const CONTACT_HREF = "mailto:hello@careo.jp?subject=%E3%82%AD%E3%83%A3%E3%83%AA%E3%82%A2%E3%82%BB%E3%83%B3%E3%82%BF%E3%83%BC%E3%81%AE%E3%81%94%E6%8F%90%E6%90%BA%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6";

const gradientTextStyle: React.CSSProperties = {
  backgroundImage: "linear-gradient(135deg, #00c896 0%, #00a87e 50%, #059669 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const gradientTextDarkStyle: React.CSSProperties = {
  backgroundImage: "linear-gradient(135deg, #00c896, #4ade80)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

export default function CareerCenterLandingPage() {
  const [tab, setTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number>(0);

  return (
    <div style={{ color: "#0D0B21", background: "white" }}>
      {/* Top meta strip */}
      <div style={{ background: "#0D0B21", color: "white", fontSize: 11 }}>
        <div
          className="flex flex-wrap items-center justify-between gap-3 md:gap-4"
          style={{ maxWidth: 1240, margin: "0 auto", padding: "9px 20px" }}
        >
          <div className="flex flex-wrap items-center gap-3 md:gap-5">
            <span style={{ color: "#00c896", fontWeight: 800, letterSpacing: 2 }}>● VOL.01 / 2026春</span>
            <span style={{ opacity: 0.9 }}>パイロット提携校 募集中</span>
            <span className="hidden md:inline" style={{ opacity: 0.4 }}>/</span>
            <span className="hidden md:inline" style={{ opacity: 0.9 }}>初回ヒアリング無料・返信48h以内</span>
          </div>
          <div className="flex items-center gap-3 md:gap-4" style={{ color: "rgba(255,255,255,.75)", fontSize: 11 }}>
            <span className="hidden sm:inline">for 大学キャリアセンター ご担当者様</span>
            <span className="hidden sm:inline" style={{ opacity: 0.4 }}>|</span>
            <a href="mailto:hello@careo.jp" style={{ color: "inherit" }}>📩 hello@careo.jp</a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(255,255,255,.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(0,0,0,.06)",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ maxWidth: 1240, margin: "0 auto", padding: "14px 20px" }}
        >
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: "none", color: "inherit" }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: "linear-gradient(135deg,#00c896,#00a87e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 900,
                fontSize: 16,
              }}
            >
              C
            </div>
            <span className="font-serif-jp" style={{ fontWeight: 700, fontSize: 22, letterSpacing: 0.5 }}>
              Careo
            </span>
            <span
              className="hidden lg:inline"
              style={{
                fontSize: 11,
                color: "#9ca3af",
                borderLeft: "1px solid #e5e7eb",
                paddingLeft: 12,
                marginLeft: 4,
                letterSpacing: 0.3,
              }}
            >
              for University Career Centers
            </span>
          </Link>
          <div className="flex items-center gap-5" style={{ fontSize: 13 }}>
            <a href="#story" className="hidden md:inline" style={{ color: "#4b5563" }}>ストーリー</a>
            <a href="#features" className="hidden md:inline" style={{ color: "#4b5563" }}>機能</a>
            <a href="#operation" className="hidden md:inline" style={{ color: "#4b5563" }}>運営体制</a>
            <a href="#faq" className="hidden md:inline" style={{ color: "#4b5563" }}>FAQ</a>
            <a
              href={CONTACT_HREF}
              className="lp-btn-primary"
              style={{
                color: "white",
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: 10,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              提携を検討する →
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ padding: "48px 20px 64px" }}
      >
        <div className="lp-dot-grid absolute inset-0" style={{ opacity: 0.5 }} />
        <div
          className="lp-hero-blob-1 animate-blob absolute"
          style={{ width: 600, height: 480, top: -140, left: -100 }}
        />
        <div
          className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-10 lg:gap-14 items-center"
          style={{ maxWidth: 1240, margin: "0 auto" }}
        >
          <div>
            <div className="flex flex-wrap gap-2" style={{ marginBottom: 20 }}>
              <span
                style={{
                  background: "rgba(0,200,150,.08)",
                  border: "1px solid rgba(0,200,150,.25)",
                  color: "#00a87e",
                  fontWeight: 700,
                  fontSize: 11,
                  padding: "6px 12px",
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  className="animate-dot-scan"
                  style={{ width: 6, height: 6, borderRadius: 3, background: "#00c896" }}
                />
                2026春パイロット募集中
              </span>
              <span
                style={{
                  background: "#eff6ff",
                  border: "1px solid #dbeafe",
                  color: "#1d4ed8",
                  fontWeight: 700,
                  fontSize: 11,
                  padding: "6px 12px",
                  borderRadius: 999,
                }}
              >
                既存システムと並行OK
              </span>
            </div>

            <h1
              className="font-serif-jp text-[40px] md:text-[52px] lg:text-[60px]"
              style={{ fontWeight: 600, lineHeight: 1.13, letterSpacing: -1.5, marginBottom: 20 }}
            >
              面談の<span style={gradientTextStyle}>「最初の3分」</span>が、<br />
              もう要らない。
            </h1>
            <p
              style={{
                fontSize: 15.5,
                lineHeight: 1.85,
                color: "#4b5563",
                marginBottom: 26,
                maxWidth: 540,
              }}
            >
              学生の就活データが面談前からダッシュボードに届くので、
              <b style={{ color: "#0D0B21" }}>近況ヒアリングに使っていた時間を、本質的なアドバイスに使えます。</b>
            </p>

            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                overflow: "hidden",
                background: "white",
                marginBottom: 24,
              }}
            >
              {TRUST_ITEMS.map((it, i) => (
                <div
                  key={it.k}
                  style={{
                    padding: "14px 14px",
                    borderRight: i % 2 === 0 ? "1px solid #f3f4f6" : "none",
                    borderTop: i >= 2 ? "1px solid #f3f4f6" : "none",
                  }}
                  className="md:!border-r md:last:!border-r-0 md:!border-t-0"
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: "#9ca3af",
                      fontWeight: 700,
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    {it.k.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0D0B21", lineHeight: 1.2 }}>{it.v}</div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{it.note}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={CONTACT_HREF}
                className="lp-btn-hero"
                style={{
                  color: "white",
                  fontWeight: 800,
                  padding: "14px 24px",
                  borderRadius: 12,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                無料ヒアリングを申し込む →
              </a>
              <a
                href={CONTACT_HREF}
                style={{
                  color: "#0D0B21",
                  fontWeight: 700,
                  padding: "14px 22px",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "white",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                3分でわかる資料DL
              </a>
            </div>
          </div>

          <DashboardMockup />
        </div>
      </section>

      {/* Operation bar */}
      <section
        id="operation"
        style={{
          background: "#fafafa",
          borderTop: "1px solid #f3f4f6",
          borderBottom: "1px solid #f3f4f6",
          padding: "22px 20px",
        }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-5 md:gap-8"
          style={{ maxWidth: 1240, margin: "0 auto" }}
        >
          <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 800, letterSpacing: 2 }}>運 営 体 制</div>
          <div className="flex flex-wrap items-center gap-5 md:gap-8">
            {OPERATION_ITEMS.map((it) => (
              <div key={it.title} className="flex items-center gap-2.5">
                <span style={{ fontSize: 20 }}>{it.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0D0B21" }}>{it.title}</div>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>{it.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story / timeline */}
      <section
        id="story"
        className="relative overflow-hidden"
        style={{ padding: "80px 20px", background: "#0D0B21" }}
      >
        <div className="lp-dark-grid absolute inset-0" style={{ opacity: 0.4 }} />
        <div
          className="absolute"
          style={{
            top: -80,
            right: -120,
            width: 520,
            height: 420,
            background: "radial-gradient(circle, rgba(0,200,150,.12), transparent 65%)",
            filter: "blur(60px)",
          }}
        />
        <div className="relative" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              color: "#00c896",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Part 01 — The Proof
          </p>
          <h2
            className="font-serif-jp text-[30px] md:text-[38px] lg:text-[44px]"
            style={{ fontWeight: 600, letterSpacing: -1, marginBottom: 16, lineHeight: 1.3, color: "white" }}
          >
            米国では<span style={{ color: "#00c896" }}>3,500億円</span>の会社が、<br />
            すでにこの問題を<span style={{ fontStyle: "italic", opacity: 0.85 }}>解いている</span>。
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,.65)",
              fontSize: 14,
              lineHeight: 1.85,
              maxWidth: 680,
              marginBottom: 48,
            }}
          >
            Handshakeは全米トップ大学の90%以上が導入し、ユニコーンになったキャリアプラットフォーム。
            同じモデルを、日本の就活文化とAIで再構築する——それがCareoです。
          </p>

          <div style={{ position: "relative", paddingLeft: 28 }}>
            <div
              style={{
                position: "absolute",
                left: 8,
                top: 6,
                bottom: 6,
                width: 1,
                background: "rgba(255,255,255,.15)",
              }}
            />
            {TIMELINE.map((e, i) => (
              <div key={e.y} style={{ position: "relative", paddingBottom: i < TIMELINE.length - 1 ? 28 : 0 }}>
                <div
                  style={{
                    position: "absolute",
                    left: -28,
                    top: 4,
                    width: 17,
                    height: 17,
                    borderRadius: 9,
                    background: e.active ? "#00c896" : "#0D0B21",
                    border: e.active ? "none" : "1px solid rgba(255,255,255,.25)",
                    boxShadow: e.active ? "0 0 0 6px rgba(0,200,150,.15)" : "none",
                  }}
                />
                <div className="flex flex-col md:flex-row md:items-baseline md:gap-5">
                  <span
                    className="font-serif-jp"
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: e.active ? "#00c896" : "rgba(255,255,255,.5)",
                      letterSpacing: -0.5,
                      minWidth: 80,
                    }}
                  >
                    {e.y}
                  </span>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, color: "white", marginBottom: 4 }}>{e.t}</h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,.65)",
                        lineHeight: 1.75,
                        maxWidth: 640,
                      }}
                    >
                      {e.d}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain + Answer tabs */}
      <section style={{ padding: "80px 20px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p
            style={{
              color: "#00a87e",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Part 02 — The Problem
          </p>
          <h2
            className="font-serif-jp text-[28px] md:text-[34px] lg:text-[40px]"
            style={{ fontWeight: 600, letterSpacing: -0.8, marginBottom: 12 }}
          >
            キャリアセンターの<span style={{ color: "#00a87e" }}>4つの課題</span>に、どう答えるか
          </h2>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 28 }}>
            調査では担当者の60〜75%がこれらを課題と回答。タブで詳細をご覧いただけます。
          </p>

          <div
            className="flex flex-wrap gap-2"
            style={{ marginBottom: 28, borderBottom: "1px solid #f3f4f6" }}
          >
            {PAIN_POINTS.map((p, i) => (
              <button
                key={p.title}
                onClick={() => setTab(i)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "14px 18px",
                  fontSize: 12,
                  fontWeight: 800,
                  color: tab === i ? "#0D0B21" : "#9ca3af",
                  borderBottom: "2px solid " + (tab === i ? "#00c896" : "transparent"),
                  marginBottom: -1,
                  transition: "0.15s",
                }}
              >
                {p.num} · 課題 0{i + 1}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <div
                className="font-serif-jp text-[56px] md:text-[72px]"
                style={{ fontWeight: 700, color: "#00a87e", letterSpacing: -3, lineHeight: 1, marginBottom: 18 }}
              >
                {PAIN_POINTS[tab].num}
              </div>
              <h3
                className="font-serif-jp text-[22px] md:text-[28px]"
                style={{ fontWeight: 600, marginBottom: 14, letterSpacing: -0.4 }}
              >
                {PAIN_POINTS[tab].title}
              </h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.9 }}>{PAIN_POINTS[tab].desc}</p>
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, rgba(0,200,150,.06), rgba(0,200,150,.02))",
                border: "1px solid rgba(0,200,150,.2)",
                borderRadius: 14,
                padding: 28,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#00a87e",
                  letterSpacing: 2,
                  marginBottom: 14,
                }}
              >
                → CAREO&apos;S ANSWER
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: "#374151" }}>{PAIN_POINTS[tab].answer}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section style={{ padding: "80px 20px", background: "#fcfbf8" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: "#00a87e",
              fontWeight: 800,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            ─── OUR PRINCIPLES ───
          </p>
          <h2
            className="font-serif-jp text-[28px] md:text-[36px] lg:text-[40px]"
            style={{ fontWeight: 600, letterSpacing: -0.8, textAlign: "center", marginBottom: 48, lineHeight: 1.35 }}
          >
            押しつけない、邪魔しない、<br />長く続ける。
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-11">
            {PRINCIPLES.map((p) => (
              <div key={p.n}>
                <div
                  className="font-serif-jp"
                  style={{ fontSize: 52, fontWeight: 600, color: "#00a87e", marginBottom: 14, lineHeight: 1 }}
                >
                  {p.n}
                </div>
                <h3
                  className="font-serif-jp"
                  style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, letterSpacing: -0.2 }}
                >
                  {p.t}
                </h3>
                <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.95 }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: "80px 20px", background: "white" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            className="flex items-baseline justify-between"
            style={{ marginBottom: 32, paddingBottom: 14, borderBottom: "1px solid #0D0B21" }}
          >
            <div>
              <p
                style={{
                  color: "#00a87e",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 3,
                  marginBottom: 6,
                }}
              >
                PART 03 — FEATURES
              </p>
              <h2
                className="font-serif-jp text-[24px] md:text-[30px] lg:text-[34px]"
                style={{ fontWeight: 600, letterSpacing: -0.6 }}
              >
                提携で使えるようになる機能
              </h2>
            </div>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>全6項目</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                style={{
                  background: "white",
                  border: "1px solid #f3f4f6",
                  borderRadius: 14,
                  padding: 22,
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: 14 }}
                >
                  <div
                    className="lp-step-icon"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 11,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {f.icon}
                  </div>
                  <span
                    className="font-serif-jp"
                    style={{ fontSize: 13, fontWeight: 700, color: "#d1d5db" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#00a87e",
                    background: "rgba(0,200,150,.08)",
                    padding: "2px 8px",
                    borderRadius: 999,
                    letterSpacing: 0.5,
                  }}
                >
                  {f.tag}
                </span>
                <h3
                  className="font-serif-jp"
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    marginTop: 12,
                    marginBottom: 6,
                    letterSpacing: -0.2,
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ color: "#6b7280", fontSize: 12.5, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section style={{ padding: "80px 20px", background: "#fafafa" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <p
                style={{
                  color: "#00a87e",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 3,
                  marginBottom: 14,
                }}
              >
                PART 04 — PRIVACY
              </p>
              <h2
                className="font-serif-jp text-[28px] md:text-[32px] lg:text-[36px]"
                style={{ fontWeight: 600, letterSpacing: -0.8, marginBottom: 18 }}
              >
                学生のデータは、<br />
                <span style={{ color: "#00a87e" }}>学生のもの。</span>
              </h2>
              <p style={{ color: "#6b7280", fontSize: 14, lineHeight: 1.9, marginBottom: 22 }}>
                Careoが大学と連携する上で最も大切にしているのは、学生への信頼です。
                強制的なデータ収集・共有は一切行いません。
              </p>
              <div className="flex flex-wrap gap-2">
                {["🔒 暗号化通信", "🏫 大学限定共有", "⚖️ 学生が同意", "🗑️ 削除依頼対応"].map((t) => (
                  <span
                    key={t}
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#374151",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SECURITY.map((s, i) => (
                <div
                  key={s.t}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 20,
                    background: i === 0 ? "rgba(0,200,150,.04)" : "white",
                  }}
                >
                  <div
                    className="font-serif-jp"
                    style={{ fontSize: 18, fontWeight: 700, color: "#00a87e", marginBottom: 10 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{s.t}</div>
                  <div style={{ color: "#6b7280", fontSize: 11.5, lineHeight: 1.65 }}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section style={{ padding: "80px 20px", background: "white" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p
              style={{
                color: "#00a87e",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Part 05 — How it works
            </p>
            <h2
              className="font-serif-jp text-[24px] md:text-[30px] lg:text-[34px]"
              style={{ fontWeight: 600, letterSpacing: -0.6 }}
            >
              提携開始まで、<span style={{ color: "#00a87e" }}>3ステップ</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div
                key={s.n}
                style={{
                  background: "white",
                  border: "1px solid #f3f4f6",
                  borderRadius: 16,
                  padding: 28,
                  textAlign: "center",
                }}
              >
                <div
                  className="lp-step-icon"
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 18,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 18px",
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#00a87e", letterSpacing: 1 }}>STEP</div>
                  <div
                    className="font-serif-jp"
                    style={{ fontSize: 22, fontWeight: 700, color: "#0D0B21", lineHeight: 1 }}
                  >
                    {s.n}
                  </div>
                </div>
                <h3
                  className="font-serif-jp"
                  style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, letterSpacing: -0.2 }}
                >
                  {s.t}
                </h3>
                <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.75 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: "80px 20px", background: "#fafafa" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p
              style={{
                color: "#00a87e",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              FAQ
            </p>
            <h2
              className="font-serif-jp text-[24px] md:text-[28px] lg:text-[32px]"
              style={{ fontWeight: 600, letterSpacing: -0.5 }}
            >
              よくあるご質問
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {FAQS.map((f, i) => (
              <div
                key={f.q}
                style={{
                  border: "1px solid " + (openFaq === i ? "rgba(0,200,150,.35)" : "#e5e7eb"),
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "white",
                  transition: "border-color 0.15s",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "18px 22px",
                    background: "white",
                    border: "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: "pointer",
                    color: "#0D0B21",
                  }}
                >
                  <span>{f.q}</span>
                  <span
                    style={{
                      color: "#00a87e",
                      fontSize: 18,
                      transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    ↓
                  </span>
                </button>
                {openFaq === i && (
                  <div
                    style={{
                      padding: "0 22px 20px",
                      color: "#4b5563",
                      fontSize: 12.5,
                      lineHeight: 1.85,
                    }}
                  >
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section
        className="relative overflow-hidden"
        style={{ background: "#0D0B21", color: "white", padding: "96px 20px" }}
      >
        <div className="lp-dot-grid-ink absolute inset-0" />
        <div
          className="absolute"
          style={{
            top: -100,
            left: "50%",
            width: 600,
            height: 400,
            background: "radial-gradient(circle, rgba(0,200,150,.18), transparent 65%)",
            filter: "blur(60px)",
            transform: "translateX(-50%)",
          }}
        />
        <div className="relative" style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <p
            style={{
              color: "#00c896",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            ─── Closing ───
          </p>
          <h2
            className="font-serif-jp text-[32px] md:text-[42px] lg:text-[48px]"
            style={{ fontWeight: 600, letterSpacing: -1.2, lineHeight: 1.25, marginBottom: 20 }}
          >
            まずは、<span style={gradientTextDarkStyle}>30分だけ</span>
            <br />
            お話をきかせてください。
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,.7)",
              lineHeight: 1.9,
              marginBottom: 36,
              maxWidth: 600,
              margin: "0 auto 36px",
            }}
          >
            貴大学の状況に合わせて、課題と最適な活用方法をご提案します。
            <br />
            初回ヒアリングは完全無料。営業色の強い提案は一切いたしません。
          </p>
          <div className="inline-flex flex-wrap gap-3 justify-center">
            <a
              href={CONTACT_HREF}
              className="lp-btn-hero"
              style={{
                color: "white",
                fontWeight: 800,
                padding: "16px 30px",
                borderRadius: 12,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              無料ヒアリングを申し込む →
            </a>
            <a
              href={CONTACT_HREF}
              style={{
                color: "white",
                fontWeight: 700,
                padding: "16px 26px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.25)",
                background: "rgba(255,255,255,.05)",
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              資料をダウンロード
            </a>
          </div>
          <div
            className="flex flex-wrap justify-between items-center gap-3"
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: "1px solid rgba(255,255,255,.08)",
              fontSize: 11,
              color: "rgba(255,255,255,.5)",
            }}
          >
            <span>© 2026 Careo — 上智大学 在学生が開発</span>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" style={{ color: "inherit" }}>プライバシー</Link>
              <Link href="/terms" style={{ color: "inherit" }}>特商法</Link>
              <a href="mailto:hello@careo.jp" style={{ color: "inherit" }}>hello@careo.jp</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div
      className="lp-mockup-window"
      style={{
        background: "white",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          background: "#f9fafb",
          borderBottom: "1px solid #f3f4f6",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 4, background: "#ef4444" }} />
        <span style={{ width: 8, height: 8, borderRadius: 4, background: "#f59e0b" }} />
        <span style={{ width: 8, height: 8, borderRadius: 4, background: "#10b981" }} />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 10,
            color: "#9ca3af",
            fontWeight: 600,
          }}
        >
          careo.jp / career-center / dashboard
        </div>
      </div>
      <div style={{ padding: 18, background: "white" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            { l: "登録学生", v: "342", d: "+24", c: "#00c896" },
            { l: "要注意", v: "18", d: "🚨", c: "#ef4444" },
            { l: "内定獲得", v: "54", d: "+12", c: "#00c896" },
            { l: "今週面談", v: "27", d: "", c: "#6366f1" },
          ].map((k) => (
            <div
              key={k.l}
              style={{ border: "1px solid #f3f4f6", borderRadius: 10, padding: 10 }}
            >
              <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, marginBottom: 3 }}>{k.l}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#0D0B21" }}>{k.v}</span>
                <span style={{ fontSize: 9, color: k.c, fontWeight: 700 }}>{k.d}</span>
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            border: "1px solid #fee2e2",
            background: "#fef2f2",
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              color: "#dc2626",
              marginBottom: 8,
            }}
          >
            🚨 孤立学生アラート <span style={{ color: "#9ca3af", fontWeight: 600 }}>・ 3件</span>
          </div>
          {[
            { n: "田中 美咲", d: "30日ログインなし・応募0社", l: "文学部3年" },
            { n: "佐藤 翔太", d: "連続お祈り4件・相談歴なし", l: "経済学部4年" },
          ].map((s, i) => (
            <div
              key={s.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderTop: i > 0 ? "1px solid #fecaca" : "none",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#dc2626",
                }}
              >
                {s.n[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800 }}>
                  {s.n} <span style={{ color: "#9ca3af", fontWeight: 500, fontSize: 10 }}>· {s.l}</span>
                </div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>{s.d}</div>
              </div>
              <button
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#dc2626",
                  background: "white",
                  border: "1px solid #fecaca",
                  borderRadius: 6,
                  padding: "4px 10px",
                }}
              >
                メッセージ
              </button>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", marginBottom: 8 }}>最近の活動</div>
          {[
            { n: "山田 花子", s: "A社 最終面接", t: "2h", p: 85, tag: "内定直前", c: "#00c896" },
            { n: "鈴木 大輔", s: "ES提出 +3件", t: "1d", p: 60, tag: "順調", c: "#6366f1" },
            { n: "高橋 沙織", s: "PDCA記入", t: "3d", p: 40, tag: "要面談", c: "#f59e0b" },
          ].map((r, i) => (
            <div
              key={r.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: i < 2 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#374151",
                }}
              >
                {r.n[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{r.n}</div>
                <div style={{ fontSize: 10, color: "#6b7280" }}>{r.s}</div>
              </div>
              <div style={{ width: 64 }}>
                <div
                  style={{
                    height: 4,
                    background: "#f3f4f6",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ height: "100%", width: r.p + "%", background: r.c }} />
                </div>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: r.c,
                  background: r.c + "15",
                  padding: "2px 6px",
                  borderRadius: 4,
                  minWidth: 54,
                  textAlign: "center",
                }}
              >
                {r.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
