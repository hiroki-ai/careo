import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ slug: string }> };

const TAG_GRADIENTS: Record<string, [string, string]> = {
  "ES対策":     ["#3b82f6", "#06b6d4"],
  "面接対策":   ["#8b5cf6", "#ec4899"],
  "自己分析":   ["#f97316", "#eab308"],
  "OB/OG訪問": ["#14b8a6", "#10b981"],
  "インターン": ["#22c55e", "#16a34a"],
  "就活管理":   ["#6366f1", "#8b5cf6"],
  "AI就活":     ["#00c896", "#0ea5e9"],
  "筆記試験":   ["#eab308", "#f97316"],
  "業界研究":   ["#f43f5e", "#e11d48"],
};

export default async function Image({ params }: Props) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, tags")
    .eq("slug", slug)
    .single();

  const title = post?.title ?? "就活ブログ | Careo";
  const tag = post?.tags?.[0] ?? "就活";
  const [gradFrom, gradTo] = TAG_GRADIENTS[tag] ?? ["#00c896", "#0ea5e9"];

  // Noto Sans JP (Bold) を取得
  // 旧UAでリクエストするとGoogle FontsがSatoriで使えるTTF形式で返す
  let fontData: ArrayBuffer | null = null;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=block",
      { headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)" } }
    ).then((r) => r.text());
    const fontUrl = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (fontUrl) fontData = await fetch(fontUrl).then((r) => r.arrayBuffer());
  } catch { /* フォント取得失敗時はシステムフォントで続行 */ }

  const fontSize = title.length > 35 ? 42 : title.length > 25 ? 48 : 54;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: `linear-gradient(135deg, #0D0B21 0%, #111028 40%, ${gradFrom}55 100%)`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 右上の大きな光彩 */}
        <div
          style={{
            position: "absolute",
            top: "-160px",
            right: "-160px",
            width: "640px",
            height: "640px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${gradFrom}55 0%, ${gradTo}22 50%, transparent 75%)`,
            display: "flex",
          }}
        />
        {/* 左下の補助光彩 */}
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            left: "-80px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${gradTo}33 0%, transparent 65%)`,
            display: "flex",
          }}
        />

        {/* 上部アクセントライン（太め） */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: `linear-gradient(90deg, ${gradFrom}, ${gradTo})`,
            display: "flex",
          }}
        />

        {/* コンテンツ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "56px 72px",
            flex: 1,
          }}
        >
          {/* タグバッジ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "28px",
            }}
          >
            <div
              style={{
                background: `linear-gradient(135deg, ${gradFrom}33, ${gradTo}22)`,
                border: `1px solid ${gradFrom}55`,
                color: gradFrom,
                fontSize: "20px",
                fontWeight: 700,
                padding: "8px 22px",
                borderRadius: "100px",
                display: "flex",
              }}
            >
              {tag}
            </div>
          </div>

          {/* タイトル */}
          <div
            style={{
              color: "white",
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              lineHeight: 1.35,
              flex: 1,
              display: "flex",
              alignItems: "center",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>

          {/* フッター */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              paddingTop: "28px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})`,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
                fontWeight: 900,
              }}
            >
              C
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ color: "white", fontSize: "22px", fontWeight: 700, display: "flex" }}>
                Careo
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "17px", display: "flex" }}>
                就活ブログ · careoai.jp
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? { fonts: [{ name: "NotoSansJP", data: fontData, style: "normal", weight: 700 }] }
        : {}),
    }
  );
}
