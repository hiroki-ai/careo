import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

// POST /api/admin/blog-create-researched?secret=xxx&delete_slug=xxx
// リサーチ済みデータを元に正確なブログ記事を生成する

function slugify(title: string, date: string): string {
  const base = date.replace(/-/g, "");
  const hash = Math.abs(title.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0))
    .toString(36)
    .slice(0, 6);
  return `${base}-${hash}`;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleteSlug = req.nextUrl.searchParams.get("delete_slug");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // 既存記事を削除
  if (deleteSlug) {
    await supabase.from("blog_posts").delete().eq("slug", deleteSlug);
  }

  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dateStr = jst.toISOString().slice(0, 10);

  // 28卒就活スケジュール 調査済みデータ（Perplexity調査 + 手動補正）
  const researchNotes = `
【28卒の学年（必ず正確に使うこと）】
2024年4月入学 → 2026年4月=大学3年生 → 2027年4月=大学4年生 → 2028年3月卒業

【公式ルール】広報開始2027/3/1・選考開始2027/6/1・正式内定2027/10/1。実態は大幅前倒し。

【月別スケジュール（重要度付き）】
・2026年4〜5月（3年春）: 業界研究・自己分析スタート ★★
・2026年6〜8月（3年夏）: サマーインターン選考・本番。外資・メガベンチャーは6月から選考開始 ★★★
・2026年9〜11月（3年秋）: 秋冬インターン応募、OB/OG訪問本格化 ★★★★
・2026年12月〜2027年2月（3年冬）: 冬インターン本番、外資・メガバンクで早期選考案内開始 ★★★★★
・2027年3月（就活解禁）: ナビサイト公開・エントリー・説明会ラッシュ ★★★★★
・2027年4〜5月（4年春）: ES・Webテスト・面接準備本格化 ★★★★★
・2027年6月〜: 選考解禁。面接ラッシュ。26卒実績でこの時期に内定率80%超 ★★★★★
・2027年10月: 正式内定式 ★★★★

【企業タイプ別スケジュール】
・外資（コンサル・IB）: 3年秋冬インターン→3〜5月本選考前倒し。ケース面接・英語面接が特徴
・日系大手: 公式ルール準拠（広報3/1・面接6/1）。インターン評価活用の早期ルートあり
・メガベンチャー（楽天・サイバーエージェント等）: サマーインターンから選考直結。3年夏〜冬に超早期内定
・スタートアップ: 通年採用。長期インターン→内定が多い

【実企業事例（事実のみ）】
・サイバーエージェント: 28卒向け「超早期内定直結インターン」2026年2月〜3月ES受付、6月3days実施
・三菱UFJ信託銀行: 28卒向けインターン2026年3月13日〜6月4日エントリー。5days「TRUST TO LAST」8月実施
・PwCコンサルティング: 28卒春インターンES締切2026年5月31日、6月21〜23日実施

【トレンド（数字は事実のみ）】
・AI就活利用: 26卒66.6%が就活でAI利用（25卒37.2%から急増）。ES推敲56.6%・ES作成41.7%
・選考形式: 一次面接WEB79.3%、最終面接対面85.0%のハイブリッド主流
・内定時期: 25卒の9月1日時点内定率94.2%（公式解禁より大幅前倒し）
・求人倍率: 26卒大卒求人倍率1.66倍（中小企業8.98倍 vs 大企業0.34倍）
`;

  const systemPrompt = `あなたは「黒木タクミ」、Careoのグロースマーケター（元スタートアップのグロース責任者）です。
X・TikTok・SEOすべて経験あり。数字に異常に強く、CAC/LTV・ファネル最適化を常に意識しています。
ちょいラフな口調で、再現性と拡散性を重視。「バズる」だけじゃなく「獲れる」施策を打ちます。

あなたは今日の就活ブログ記事を書いています。
CareoはES締切・面接・OB訪問・筆記試験をすべて一か所で管理し、全データを把握したAIコーチ「カレオ」が個人化アドバイスを届ける就活管理アプリ（careoai.jp、完全無料）です。

【最重要: 事実の正確性】
以下に調査済みの正確なデータを提供します。このデータのみを使い、推測・創作は一切しないこと。
データにない具体的な数字・日付・社名は書かない。

${researchNotes}

【記事ルール】
- 読者: 就活中の大学生（主に28卒）
- 文体: 共感しやすい、丁寧だが距離感が近い口語体
- 文量: 読者にとって必要十分な量を書ききること（目安2000〜3500文字）。途中で終わらず必ずCTAまで完結させる
- 「なぜ」と「どうすれば」を必ず両方書く。具体的・実践的に
- Careoへの自然な言及を記事中に1〜2箇所

【SEO必須ルール】
1. フォーカスキーフレーズ: JSONで指定したfocus_keyphraseを、タイトル・最初のp・h2見出し2箇所以上・本文中に計5〜8回自然に登場させる
2. 外部引用: 提供データに含まれる情報源（厚労省・経団連・マイナビ等）を必ず1つ以上引用し、<a href="..." target="_blank" rel="noopener noreferrer">出典名</a>でリンクする
3. 比較表: HTMLの<table>タグで比較・整理表を最低1つ入れる（企業タイプ別など）
4. 視覚的要素: 数値データは<div class="blog-stat-bar">などで棒グラフ的に表現するか、<blockquote>で強調する
5. 他社サービス・企業へのリンク必須: 記事中に登場する他社サービスは必ず公式URLで<a href="URL" target="_blank" rel="noopener noreferrer">名前</a>にリンクすること

【HTML形式】
- 使用可能タグ: <h2> <h3> <p> <ul> <ol> <li> <strong> <em> <blockquote> <table> <thead> <tbody> <tr> <th> <td> <a> <div>
- <html><body><head>タグは不要。記事本文のHTMLのみ
- 記事末尾に必ずCTA: <a href="https://careoai.jp/signup" class="blog-cta-link">Careoで就活を管理する →</a>`;

  const userPrompt = `今日のブログ記事を作成してください。

テーマ: 就活管理
SEOキーワード: 28卒 就活スケジュール 完全版
投稿日: ${dateStr}

最初の行にJSONを返してください（本文HTMLの前）:
{"title":"記事タイトル","description":"メタディスクリプション（120〜160文字）","tags":["タグ1","タグ2","タグ3"],"reading_time_min":読了時間分数,"focus_keyphrase":"この記事で5〜8回登場させるキーフレーズ"}

JSONの後に改行2つ置いて、記事本文のHTMLを書いてください。

※28卒の大学3年生は2026年4月〜2027年3月、大学4年生は2027年4月〜2028年3月です。この学年情報を記事内で正確に使うこと。`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  const cleanRaw = raw.replace(/```(?:json)?/gi, "").trim();

  const jsonStart = cleanRaw.indexOf("{");
  if (jsonStart === -1) {
    return NextResponse.json({ error: "JSON not found", raw: raw.slice(0, 300) }, { status: 500 });
  }
  let depth = 0, jsonEnd = -1;
  for (let i = jsonStart; i < cleanRaw.length; i++) {
    if (cleanRaw[i] === "{") depth++;
    else if (cleanRaw[i] === "}") { depth--; if (depth === 0) { jsonEnd = i; break; } }
  }
  if (jsonEnd === -1) {
    return NextResponse.json({ error: "JSON not closed", raw: raw.slice(0, 300) }, { status: 500 });
  }

  const jsonStr = cleanRaw.slice(jsonStart, jsonEnd + 1);
  let meta: { title: string; description: string; tags: string[]; reading_time_min: number; focus_keyphrase?: string };
  try {
    meta = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: "JSON invalid", raw: jsonStr }, { status: 500 });
  }

  const body = cleanRaw.slice(jsonEnd + 1).trim();
  const slug = slugify(meta.title, dateStr);

  const { error } = await supabase.from("blog_posts").insert({
    slug,
    focus_keyphrase: meta.focus_keyphrase ?? "28卒 就活スケジュール",
    title: meta.title,
    description: meta.description,
    body,
    tags: meta.tags ?? ["就活管理"],
    reading_time_min: meta.reading_time_min ?? 8,
    published_at: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: "insert failed", detail: error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug, title: meta.title });
}
