import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * 診断結果をSNS用1枚画像（1200×630）で返す。
 * ?type=strategist|pioneer|explorer|craftsman|relator
 */
const TYPES = {
  strategist: { emoji: "📊", title: "戦略家タイプ", head: "データで勝つ就活ストラテジスト" },
  pioneer: { emoji: "🚀", title: "先駆者タイプ", head: "挑戦で切り拓く就活パイオニア" },
  explorer: { emoji: "🔍", title: "探求者タイプ", head: "軸を探す就活エクスプローラー" },
  craftsman: { emoji: "⚙️", title: "職人タイプ", head: "専門性で勝負する就活クラフツマン" },
  relator: { emoji: "🤝", title: "関係重視タイプ", head: "人とカルチャーで選ぶ就活リレーター" },
} as const;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "strategist") as keyof typeof TYPES;
  const info = TYPES[type] ?? TYPES.strategist;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#fcfbf8",
          padding: "56px 64px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#0D0B21",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, background: "radial-gradient(circle, rgba(0,200,150,0.25), transparent 65%)", borderRadius: 999, display: "flex" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ display: "flex", padding: "8px 16px", background: "rgba(0,200,150,0.12)", borderRadius: 999, color: "#00a87e", fontSize: 20, fontWeight: 800 }}>
            Careo 就活タイプ診断
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 140, lineHeight: 1, marginBottom: 10 }}>{info.emoji}</div>
        <div style={{ display: "flex", fontSize: 32, color: "#00a87e", fontWeight: 800, marginBottom: 8 }}>あなたのタイプは</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 900, letterSpacing: -2, marginBottom: 14 }}>{info.title}</div>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: "#4b5563" }}>{info.head}</div>

        <div style={{ display: "flex", marginTop: "auto", alignItems: "center", justifyContent: "space-between", paddingTop: 22, borderTop: "1px solid rgba(13,11,33,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #00c896, #00a87e)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 22 }}>C</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Careo</div>
              <div style={{ fontSize: 16, color: "#6b7280" }}>careoai.jp/diagnosis</div>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 20, color: "#00a87e", fontWeight: 800 }}>
            あなたも3分で診断 →
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
