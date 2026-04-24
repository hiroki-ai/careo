import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const ACCENT = "#00c896";
const ACCENT_DEEP = "#00a87e";
const INK = "#0D0B21";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const axis = (sp.get("axis") ?? "").slice(0, 90);
  const strengthsRaw = (sp.get("strengths") ?? "").slice(0, 160);
  const weaknessesRaw = (sp.get("weaknesses") ?? "").slice(0, 120);
  const university = (sp.get("univ") ?? "").slice(0, 30);

  const strengths = strengthsRaw
    .split(/[・,、\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0D0B21 0%, #1a2f4e 60%, #0D0B21 100%)",
          padding: "56px 64px",
          fontFamily: "sans-serif",
          color: "white",
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "white", fontSize: 26, fontWeight: 900 }}>C</span>
            </div>
            <span style={{ color: "white", fontSize: 28, fontWeight: 800 }}>Careo</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center",
            fontSize: 14, fontWeight: 800, color: ACCENT,
            background: "rgba(0,200,150,0.15)", border: "1px solid rgba(0,200,150,0.3)",
            borderRadius: 999, padding: "6px 14px",
          }}>
            自己分析マップ
          </div>
        </div>

        {/* 就活の軸 */}
        <div style={{ fontSize: 12, fontWeight: 800, color: ACCENT, letterSpacing: 2, marginBottom: 10, display: "flex" }}>
          CAREER AXIS · 就活の軸
        </div>
        <div style={{
          fontSize: 34, fontWeight: 900, color: "white", lineHeight: 1.4,
          marginBottom: 32, display: "flex",
        }}>
          {axis || "自分の軸を、Careoで言語化中。"}
        </div>

        {/* 強み 3つ */}
        <div style={{ fontSize: 12, fontWeight: 800, color: ACCENT, letterSpacing: 2, marginBottom: 12, display: "flex" }}>
          STRENGTHS · 強み
        </div>
        <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
          {(strengths.length > 0 ? strengths : ["あなたの強み1", "あなたの強み2", "あなたの強み3"]).map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(0,200,150,0.25)",
                borderRadius: 18,
                padding: "18px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <div style={{
                fontSize: 20, fontWeight: 900, color: ACCENT,
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(0,200,150,0.2)", marginBottom: 10,
              }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "white", lineHeight: 1.4, display: "flex" }}>
                {s}
              </div>
            </div>
          ))}
        </div>

        {/* 弱み・克服 */}
        {weaknessesRaw && (
          <div style={{
            background: "rgba(255,255,255,0.05)",
            borderLeft: `3px solid ${ACCENT}`,
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: "auto",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: ACCENT, letterSpacing: 2, marginBottom: 4, display: "flex" }}>
              GROWTH AREA · 克服中
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, display: "flex" }}>
              {weaknessesRaw}
            </div>
          </div>
        )}

        {/* フッター */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", display: "flex" }}>
            {university ? `${university} · ` : ""}就活ログを、人生資産に。
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "white", display: "flex" }}>
            careoai.jp
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
