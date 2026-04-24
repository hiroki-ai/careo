"use client";

import Link from "next/link";
import { CareoKun } from "@/components/landing/CareoKun";
import { ChatBubble } from "@/components/ui/app";

export default function ChatPage() {
  return (
    <div style={{ background: "var(--app-surface-1)", minHeight: "100vh", color: "var(--app-text)" }}>
      <div
        className="flex flex-col"
        style={{ padding: "22px 16px 120px", maxWidth: 780, margin: "0 auto", gap: 18 }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--app-text-muted)",
              fontWeight: 800,
              letterSpacing: 1.5,
              marginBottom: 6,
            }}
          >
            KAREO CHAT · BETA
          </div>
          <h1
            className="font-klee"
            style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}
          >
            カレオとチャット
          </h1>
          <div style={{ fontSize: 12, color: "var(--app-text-muted)", marginTop: 4 }}>
            文脈を保持したまま深く議論できるチャット機能（準備中）
          </div>
        </div>

        <div
          className="flex flex-col gap-3"
          style={{
            padding: "20px 18px 24px",
            background: "var(--app-surface-0)",
            border: "1px solid var(--app-border)",
            borderRadius: "var(--app-r-lg)",
          }}
        >
          <ChatBubble who="careo" timestamp="予定">
            やあ！ここでは文脈を保ったまま深く議論できるチャットを作ってます。
          </ChatBubble>
          <ChatBubble who="careo">
            今は <b>ダッシュボード</b> でAIアドバイスを受け取れるし、<b>週次コーチ</b>
            でまとめた振り返りも見られるよ。
          </ChatBubble>
          <ChatBubble who="careo">
            フルチャット機能は近日公開予定 ✨
          </ChatBubble>
        </div>

        <div
          className="flex flex-col items-center text-center"
          style={{
            padding: "28px 20px",
            background: "linear-gradient(160deg, var(--app-accent-soft), var(--app-surface-0) 70%)",
            border: "1px solid rgba(0,200,150,.22)",
            borderRadius: "var(--app-r-xl)",
          }}
        >
          <CareoKun size={96} mood="think" />
          <div
            className="font-klee"
            style={{ fontSize: 17, fontWeight: 700, color: "var(--app-text)", marginTop: 12, marginBottom: 8 }}
          >
            今できるカレオとの対話
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: "var(--app-text-muted)",
              lineHeight: 1.8,
              maxWidth: 360,
              marginBottom: 16,
            }}
          >
            いますぐ使えるAIコーチング機能はこちら。
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/"
              style={{
                padding: "10px 18px",
                fontSize: 12.5,
                fontWeight: 800,
                borderRadius: "var(--app-r-pill)",
                background: "var(--app-accent)",
                color: "white",
                boxShadow: "var(--app-shadow-teal)",
                textDecoration: "none",
              }}
            >
              ダッシュボードへ →
            </Link>
            <Link
              href="/weekly-coach"
              style={{
                padding: "10px 18px",
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: "var(--app-r-pill)",
                background: "white",
                color: "var(--app-text)",
                border: "1px solid var(--app-border-strong)",
                textDecoration: "none",
              }}
            >
              週次コーチ →
            </Link>
            <Link
              href="/report"
              style={{
                padding: "10px 18px",
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: "var(--app-r-pill)",
                background: "white",
                color: "var(--app-text)",
                border: "1px solid var(--app-border-strong)",
                textDecoration: "none",
              }}
            >
              PDCAレポート →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
