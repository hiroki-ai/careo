/**
 * 統一感アイコンセット生成スクリプト
 *
 * 実行: GEMINI_API_KEY=xxx node scripts/generate-icons.mjs
 *
 * Gemini Imagen API (gemini-2.5-flash-image) を使ってカレオブランド統一の
 * アイコンセットをpublic/icons/に生成する。スタイルは「丸みのある2D・ティール
 * (#00c896)アクセント・白背景・線画+ソリッド」で統一。
 *
 * 機能アイコンが増えたらここに追加するだけで再生成可能。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/icons");

const ICONS = [
  { name: "calendar", concept: "就活専用カレンダーを表す丸みのある2Dカレンダーアイコン。ピン留めされた小さな星と、ティール色の今日マーカー" },
  { name: "coaching", concept: "AIコーチを表す丸みのある2D吹き出しと小さなロボットの組み合わせ" },
  { name: "es", concept: "エントリーシートを表す丸みのある書類2Dアイコン。羽ペンで書き込んでいる様子" },
  { name: "interview", concept: "面接を表す2人の人物が向かい合う丸みのある2Dアイコン" },
  { name: "ob-visit", concept: "OB訪問を表すコーヒーカップと2人の人物の丸みのある2Dアイコン" },
  { name: "test", concept: "筆記試験を表す丸みのある2D答案用紙とチェックマーク" },
  { name: "company", concept: "企業を表す丸みのある2Dビル建物アイコン。窓に小さなティール色のアクセント" },
  { name: "pdca", concept: "PDCAサイクルを表す矢印が円を描く2Dアイコン" },
  { name: "gmail", concept: "メール連携を表す丸みのある2D封筒アイコンとティール色の小さな矢印" },
];

const STYLE_PROMPT = `
スタイル: 丸みのある2D。線画 + ソリッドの組み合わせ。
カラーパレット: ベース白(#ffffff)、メインアクセントはティール(#00c896 / #00a87e)、サブはダークインク(#0d0b21)、ペールピンク(#ffd6dd)を1点だけアクセント。
背景: 透過 or 純白。ノイズ・グラデーションなし。
雰囲気: 親しみやすく、就活生に寄り添うかわいさ。Notion / Linear / Stripe のようなプロダクトUIアイコン。
形式: 正方形 1024x1024 png。
`.trim();

function buildPrompt(icon) {
  return `${icon.concept}

${STYLE_PROMPT}

このアイコンセットの他のアイコンと統一感を必ず保つこと。同じ線の太さ、同じ角の丸み、同じ色比率。`;
}

async function generateIcon(icon) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: buildPrompt(icon) }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gemini API error ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!part) throw new Error("No image in response");

  const buf = Buffer.from(part.inlineData.data, "base64");
  const outPath = path.join(OUT_DIR, `${icon.name}.png`);
  fs.writeFileSync(outPath, buf);
  console.log(`✓ Generated: ${outPath}`);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Generating ${ICONS.length} icons to ${OUT_DIR}\n`);
  for (const icon of ICONS) {
    try {
      await generateIcon(icon);
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.error(`✗ ${icon.name}:`, e.message);
    }
  }
  console.log("\nDone. Check public/icons/ and commit if satisfied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
