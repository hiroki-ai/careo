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
    .select("title, tags, thumbnail_url")
    .eq("slug", slug)
    .single();

  // If a Gemini-generated thumbnail exists, fetch and return it directly
  if (post?.thumbnail_url) {
    try {
      const imgRes = await fetch(post.thumbnail_url);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        const ct = imgRes.headers.get("content-type") || "image/png";
        return new Response(buffer, {
          headers: { "Content-Type": ct, "Cache-Control": "public, max-age=86400" },
        });
      }
    } catch {
      // Fallback to Satori generation below
    }
  }

  const title = post?.title ?? "就活ブログ | Careo";
  const tag = post?.tags?.[0] ?? "AI就活";
  const [gradFrom, gradTo] = TAG_GRADIENTS[tag] ?? ["#00c896", "#0ea5e9"];

  // Noto Sans JP (Bold) を取得
  let fontData: ArrayBuffer | null = null;
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=block",
      { headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)" } }
    ).then((r) => r.text());
    const fontUrl = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (fontUrl) fontData = await fetch(fontUrl).then((r) => r.arrayBuffer());
  } catch { /* フォント取得失敗時はシステムフォントで続行 */ }

  const fontSize = title.length > 35 ? 44 : title.length > 25 ? 52 : 58;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 右上の装飾円 — Satori対応: rgba のみ使用 */}
        <div
          style={{
            position: "absolute",
            top: "-180px",
            right: "-180px",
            width: "560px",
            height: "560px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-120px",
            left: "-100px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
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
                background: "rgba(255,255,255,0.22)",
                color: "white",
                fontSize: "22px",
                fontWeight: 700,
                padding: "8px 24px",
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
              lineHeight: 1.4,
              flex: 1,
              display: "flex",
              alignItems: "center",
              letterSpacing: "-0.01em",
              textShadow: "0 2px 8px rgba(0,0,0,0.2)",
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
              borderTop: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "26px",
                fontWeight: 900,
              }}
            >
              C
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ color: "white", fontSize: "24px", fontWeight: 700, display: "flex" }}>
                Careo
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", display: "flex" }}>
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
