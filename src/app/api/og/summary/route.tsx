import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

/**
 * ユーザーの就活サマリーをSNS用の1枚画像（1200×630）で返す。
 * ?username=xxx が指定されれば公開プロフィールからデータを取得。
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") ?? "careo-user";

  type SummaryRow = {
    username: string;
    graduation_year?: number;
    companies_count?: number;
    offered_count?: number;
    es_count?: number;
    interview_count?: number;
    university?: string;
  };
  let stats: SummaryRow = { username };
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase.rpc("get_public_profile", { p_username: username });
    const row = Array.isArray(data) ? data[0] : data;
    if (row) stats = row;
  } catch {
    /* fallback to defaults */
  }

  const grad = stats.graduation_year ?? 2028;
  const companies = stats.companies_count ?? 0;
  const offered = stats.offered_count ?? 0;
  const esCount = stats.es_count ?? 0;
  const interviews = stats.interview_count ?? 0;
  const university = stats.university ?? "";

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
        {/* decorative blobs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, background: "radial-gradient(circle, rgba(0,200,150,0.25), transparent 65%)", borderRadius: 999, display: "flex" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 280, height: 280, background: "radial-gradient(circle, rgba(255,200,100,0.25), transparent 65%)", borderRadius: 999, display: "flex" }} />

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 16px", background: "rgba(0,200,150,0.12)", borderRadius: 999, color: "#00a87e", fontSize: 20, fontWeight: 800 }}>
            ● Careo 就活記録
          </div>
        </div>

        {/* title */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 32 }}>
          <div style={{ fontSize: 28, color: "#4b5563", marginBottom: 6, fontWeight: 500 }}>
            @{username} · {grad}年卒{university ? ` · ${university}` : ""}
          </div>
          <div style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.15, letterSpacing: -1 }}>
            就活の軌跡を<span style={{ color: "#00a87e" }}>データで可視化</span>
          </div>
        </div>

        {/* stats grid */}
        <div style={{ display: "flex", gap: 16, marginTop: "auto" }}>
          {[
            { label: "応募企業", value: companies, tint: "#60a5fa" },
            { label: "ES提出", value: esCount, tint: "#a78bfa" },
            { label: "面接経験", value: interviews, tint: "#f472b6" },
            { label: "内定・合格", value: offered, tint: "#00c896" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                background: "white",
                borderRadius: 24,
                padding: "22px 26px",
                border: "1px solid rgba(13,11,33,0.08)",
                boxShadow: "0 4px 16px rgba(13,11,33,0.06)",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: "#6b7280", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: s.tint, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32, paddingTop: 22, borderTop: "1px solid rgba(13,11,33,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #00c896, #00a87e)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 22 }}>C</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22, fontWeight: 900 }}>Careo</div>
              <div style={{ fontSize: 16, color: "#6b7280" }}>就活管理アプリ · careoai.jp</div>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 18, color: "#00a87e", fontWeight: 800 }}>
            あなたも3分でタイプ診断 →
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
