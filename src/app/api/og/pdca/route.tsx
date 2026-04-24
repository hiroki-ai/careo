import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const ACCENT = "#00c896";
const ACCENT_DEEP = "#00a87e";
const INK = "#0D0B21";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const score = Math.max(0, Math.min(100, Number(sp.get("score") ?? "0") || 0));
  const focus = (sp.get("focus") ?? "").slice(0, 40);
  const weeklyGoal = (sp.get("goal") ?? "").slice(0, 60);
  const goodPoint = (sp.get("good") ?? "").slice(0, 60);
  const improvement = (sp.get("improve") ?? "").slice(0, 60);
  const week = sp.get("week") ?? "";

  const scoreLabel =
    score >= 80 ? "非常に良い" : score >= 60 ? "良好" : score >= 40 ? "平均的" : "要改善";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#F7F5F0",
          padding: "56px 64px",
          fontFamily: "sans-serif",
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
            <span style={{ color: INK, fontSize: 28, fontWeight: 800 }}>Careo</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 14, fontWeight: 800, color: ACCENT_DEEP,
            background: `${ACCENT}18`, borderRadius: 999, padding: "6px 14px",
          }}>
            採用コンサル視点 × AI
          </div>
        </div>

        <div style={{ fontSize: 16, color: "#6b7280", marginBottom: 10, display: "flex" }}>
          週次PDCAレポート{week ? ` · ${week}` : ""}
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, color: INK, letterSpacing: -1, lineHeight: 1.2, marginBottom: 24, display: "flex" }}>
          {weeklyGoal || "今週の就活を、AIが採点した。"}
        </div>

        {/* スコアとフォーカス */}
        <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
          <div style={{
            flex: "0 0 260px",
            background: "white",
            borderRadius: 24,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", letterSpacing: 2, marginBottom: 8, display: "flex" }}>
              SCORE
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 96, fontWeight: 900, color: ACCENT_DEEP, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: 20, color: "#9ca3af", fontWeight: 700 }}>/100</span>
            </div>
            <div style={{
              fontSize: 14, fontWeight: 800, color: ACCENT_DEEP,
              background: `${ACCENT}18`, borderRadius: 999, padding: "4px 14px",
              marginTop: 10, display: "flex",
            }}>
              {scoreLabel}
            </div>
          </div>

          <div style={{
            flex: 1,
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
            borderRadius: 24,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: "white",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 8, opacity: 0.85, display: "flex" }}>
              NEXT WEEK FOCUS
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.3, display: "flex" }}>
              {focus || "次の一手をAIが設計"}
            </div>
          </div>
        </div>

        {/* 良い点 / 改善 */}
        <div style={{ display: "flex", gap: 16, marginBottom: "auto" }}>
          {goodPoint && (
            <div style={{
              flex: 1, background: "white", borderRadius: 18, padding: 18,
              borderLeft: `4px solid ${ACCENT}`, display: "flex", flexDirection: "column",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: ACCENT_DEEP, marginBottom: 6, display: "flex" }}>
                ✓ うまくいっている
              </div>
              <div style={{ fontSize: 16, color: INK, lineHeight: 1.5, display: "flex" }}>{goodPoint}</div>
            </div>
          )}
          {improvement && (
            <div style={{
              flex: 1, background: "white", borderRadius: 18, padding: 18,
              borderLeft: "4px solid #8b5cf6", display: "flex", flexDirection: "column",
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#8b5cf6", marginBottom: 6, display: "flex" }}>
                → 次の改善アクション
              </div>
              <div style={{ fontSize: 16, color: INK, lineHeight: 1.5, display: "flex" }}>{improvement}</div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
          <div style={{ fontSize: 14, color: "#6b7280", display: "flex" }}>
            28卒の就活を、OSで攻略する
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: INK, display: "flex" }}>
            careoai.jp
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
