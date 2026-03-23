import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Careo - AI就活コーチアプリ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0D0B21 0%, #1a2f4e 50%, #0D0B21 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* ロゴエリア */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "48px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "16px",
            background: "linear-gradient(135deg, #00c896, #00a87e)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontSize: "36px", fontWeight: "bold" }}>C</span>
          </div>
          <span style={{ color: "white", fontSize: "48px", fontWeight: "bold", letterSpacing: "-1px" }}>Careo</span>
        </div>

        {/* メインコピー */}
        <div style={{ color: "#00c896", fontSize: "72px", fontWeight: "bold", lineHeight: 1.1, marginBottom: "24px" }}>
          迷わず動ける、
        </div>
        <div style={{ color: "white", fontSize: "72px", fontWeight: "bold", lineHeight: 1.1, marginBottom: "40px" }}>
          就活へ。
        </div>

        {/* サブコピー */}
        <div style={{ color: "#94a3b8", fontSize: "28px", lineHeight: 1.5 }}>
          AI就活コーチ「カレオ」が選考・ES・面接・OB訪問を全部把握
        </div>

        {/* タグ */}
        <div style={{
          marginTop: "48px", display: "flex", alignItems: "center", gap: "16px",
        }}>
          <div style={{
            background: "rgba(0, 200, 150, 0.2)", border: "1px solid #00c896",
            borderRadius: "100px", padding: "8px 24px",
            color: "#00c896", fontSize: "22px", fontWeight: "bold",
          }}>
            就活生向け
          </div>
          <div style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "100px", padding: "8px 24px",
            color: "white", fontSize: "22px",
          }}>
            無料・登録5分
          </div>
          <div style={{
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "100px", padding: "8px 24px",
            color: "white", fontSize: "22px",
          }}>
            careoai.jp
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
