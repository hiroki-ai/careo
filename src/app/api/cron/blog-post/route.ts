import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

// Vercel Cron: 毎朝8時（JST）= 23:00 UTC 前日
// vercel.json: "crons": [{ "path": "/api/cron/blog-post", "schedule": "0 23 * * *" }]

// ─── タクミの戦略キャラクター ────────────────────────────────────────────────
const TAKUMI_PERSONA = `あなたは「黒木タクミ」、Careoのグロースマーケター（元スタートアップのグロース責任者）です。
X・TikTok・SEOすべて経験あり。数字に異常に強く、CAC/LTV・ファネル最適化を常に意識しています。
ちょいラフな口調で、再現性と拡散性を重視。「バズる」だけじゃなく「獲れる」施策を打ちます。`;

// ─── SEO特化トピックプール ───────────────────────────────────────────────────
// 就活生が実際に検索するロングテールキーワードを軸に設計
const TOPIC_POOL = [
  // ES対策
  { theme: "ES対策", keyword: "ES 書き方 コツ 就活", hint: "ESで落ちる人に共通する3つの書き方ミスと、Careoが自動チェックする方法" },
  { theme: "ES対策", keyword: "ガクチカ 書き方 例文", hint: "ガクチカで差がつく「数字の使い方」と深掘り質問への準備法" },
  { theme: "ES対策", keyword: "自己PR 書き方 就活", hint: "自己PRで採用担当者の目に止まる「具体性」の作り方" },
  { theme: "ES対策", keyword: "ES 管理 複数社 就活", hint: "ES10社同時進行で破綻しない管理術——Careoのやり方を公開" },
  { theme: "ES対策", keyword: "ES 締切 管理 忘れる", hint: "ES締切を忘れる人がやっていない「見える化」の習慣" },
  { theme: "ES対策", keyword: "ES 提出前 チェック AI", hint: "ES提出前にAIに添削させると見えてくる「盲点3つ」" },

  // 面接対策
  { theme: "面接対策", keyword: "面接 準備 就活 コツ", hint: "面接前日の「最強準備ルーティン」をCareoユーザーに聞いた" },
  { theme: "面接対策", keyword: "面接 逆質問 例 就活", hint: "「何か質問はありますか？」で差をつける逆質問10選と失敗例" },
  { theme: "面接対策", keyword: "面接 フィードバック 振り返り", hint: "面接の振り返りをAIに分析させると「盲点」が見えてくる話" },
  { theme: "面接対策", keyword: "グループディスカッション 就活 対策", hint: "GDで評価される立ち回りと「記録すべき反省点」" },
  { theme: "面接対策", keyword: "最終面接 対策 就活", hint: "最終面接で落ちる人がやっていない「入社意欲の言語化」" },
  { theme: "面接対策", keyword: "一次面接 通過率 上げる", hint: "一次面接の通過率を上げる「最初の30秒」の作り方" },

  // 自己分析
  { theme: "自己分析", keyword: "自己分析 やり方 就活 深掘り", hint: "自己分析が「浅い」と言われた人のための、Careoの3軸アプローチ" },
  { theme: "自己分析", keyword: "強み 弱み 就活 見つけ方", hint: "「強みがわからない」人へ。過去の行動から強みを掘り出す方法" },
  { theme: "自己分析", keyword: "就活 軸 決め方 企業選び", hint: "就活の軸を3つに絞るべき理由と、Careoでの設定方法" },
  { theme: "自己分析", keyword: "自己分析 ツール 就活 おすすめ", hint: "就活の自己分析ツール比較——StrengthsFinderからAIまで" },

  // OB/OG訪問
  { theme: "OB/OG訪問", keyword: "OB訪問 やり方 就活", hint: "OB訪問の「当日何を聞くべきか」完全ガイド" },
  { theme: "OB/OG訪問", keyword: "OB訪問 お礼メール テンプレ", hint: "OB訪問後のお礼メールで次の紹介につながる書き方" },
  { theme: "OB/OG訪問", keyword: "OB訪問 記録 活用", hint: "OB訪問を「記録・活用」しないと損する理由とCareoの使い方" },
  { theme: "OB/OG訪問", keyword: "OB訪問 依頼 メール 送り方", hint: "OB訪問を断られない依頼メールの書き方と送るタイミング" },

  // インターン
  { theme: "インターン", keyword: "インターン 就活 活かし方", hint: "インターン経験をESと面接で最大限に活かす構造化の方法" },
  { theme: "インターン", keyword: "インターン 選考 対策 倍率", hint: "インターン選考を突破する人がやっている「企業研究の深度」" },
  { theme: "インターン", keyword: "サマーインターン 準備 いつから", hint: "サマーインターンに備えて今すぐやるべき3つの準備" },
  { theme: "インターン", keyword: "長期インターン 就活 有利", hint: "長期インターンは就活に有利なのか？正直なメリット・デメリット" },

  // 就活スケジュール・管理
  { theme: "就活管理", keyword: "就活 スケジュール 管理 28卒", hint: "28卒の就活スケジュール完全版——月ごとにやることをまとめた" },
  { theme: "就活管理", keyword: "就活 管理 アプリ 比較", hint: "Notion・スプシ・Careoを1ヶ月使い比べた正直レビュー" },
  { theme: "就活管理", keyword: "就活 PDCA 改善 内定", hint: "就活でPDCAを回すとは何か——具体的なやり方とCareoの自動分析" },
  { theme: "就活管理", keyword: "就活 進捗 見える化 一覧", hint: "「今どこ？」がわかる就活進捗管理の正解形" },
  { theme: "就活管理", keyword: "就活 複数社 両立 コツ", hint: "選考10社以上を並行させても崩れない就活管理の仕組み" },

  // AI × 就活
  { theme: "AI就活", keyword: "AI 就活 使い方 ChatGPT", hint: "ChatGPTと就活特化AIの違い——あなたのデータを「知っているか」が全て" },
  { theme: "AI就活", keyword: "AI ES 生成 注意点", hint: "AIにESを書かせた末路と、正しいAI活用の境界線" },
  { theme: "AI就活", keyword: "AI 就活コーチ 個別化", hint: "就活AIコーチに「個人データ」を渡すと何が変わるのか" },
  { theme: "AI就活", keyword: "生成AI 就活 バレる", hint: "ES・面接でAI使用はバレるのか？面接官の本音と正しい使い方" },

  // 筆記試験
  { theme: "筆記試験", keyword: "SPI 対策 就活 短期", hint: "SPI3を2週間で仕上げる学習ルートと記録の仕方" },
  { theme: "筆記試験", keyword: "玉手箱 対策 就活 コツ", hint: "玉手箱で時間が足りない人への攻略法と問題傾向" },
  { theme: "筆記試験", keyword: "筆記試験 管理 複数 就活", hint: "複数社の筆記試験を整理する方法——Careoの筆記管理機能を使った例" },

  // 業界研究
  { theme: "業界研究", keyword: "業界研究 就活 やり方", hint: "「業界研究が浅い」と言われないための情報収集3ステップ" },
  { theme: "業界研究", keyword: "IT業界 就活 28卒 動向", hint: "28卒がIT業界に就職する前に知っておきたいこと" },
  { theme: "業界研究", keyword: "コンサル 就活 対策 難易度", hint: "コンサル就活に特化した準備ロードマップ（28卒版）" },
];

type RecentPost = { title: string; tags: string[]; published_at: string };

function pickTopic(recentPosts: RecentPost[]): typeof TOPIC_POOL[0] {
  // 直近7日間のテーマ使用状況を集計
  const recentThemes = recentPosts.map((p) => p.tags[0] ?? "");
  const themeCounts: Record<string, number> = {};
  for (const t of recentThemes) {
    themeCounts[t] = (themeCounts[t] ?? 0) + 1;
  }

  // 直近のタイトルで使用済みキーワードを確認
  const usedHints = new Set(recentPosts.map((p) => p.title.slice(0, 10)));

  // スコアリング: テーマ使用頻度が低いほど高スコア、未使用ヒントを優先
  const scored = TOPIC_POOL.map((topic) => {
    const themeCount = themeCounts[topic.theme] ?? 0;
    const isUsed = [...usedHints].some((h) => topic.hint.includes(h));
    return { topic, score: -themeCount * 10 + (isUsed ? -5 : 0) + Math.random() * 3 };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].topic;
}

function slugify(title: string, date: string): string {
  const base = date.replace(/-/g, "");
  const hash = Math.abs(title.split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 0))
    .toString(36)
    .slice(0, 6);
  return `${base}-${hash}`;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const force = req.nextUrl.searchParams.get("force") === "1";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dateStr = jst.toISOString().slice(0, 10);

  // 当日分が既に存在する場合はスキップ（forceなら無視）
  if (!force) {
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .gte("published_at", `${dateStr}T00:00:00+09:00`)
      .lte("published_at", `${dateStr}T23:59:59+09:00`)
      .limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: "already_exists_today" });
    }
  }

  // 直近14日分の記事を取得してPDCAに活用
  const { data: recentPosts } = await supabase
    .from("blog_posts")
    .select("title, tags, published_at")
    .order("published_at", { ascending: false })
    .limit(14);

  const topic = pickTopic(recentPosts ?? []);

  // 直近の傾向をタクミに渡す
  const recentSummary =
    recentPosts && recentPosts.length > 0
      ? `直近の投稿テーマ: ${recentPosts.slice(0, 7).map((p) => p.tags[0]).join("、")}`
      : "初回投稿";

  const systemPrompt = `${TAKUMI_PERSONA}

あなたは今日の就活ブログ記事を書いています。
CareoはES締切・面接・OB訪問・筆記試験をすべて一か所で管理し、全データを把握したAIコーチ「カレオ」が個人化アドバイスを届ける就活管理アプリ（careoai.jp、完全無料）です。

【記事ルール】
- 読者: 就活中の大学生（主に28卒・29卒）
- 文体: 共感しやすい、丁寧だが距離感が近い口語体
- 文量: 読者にとって必要十分な量を書ききること（目安2000〜3500文字）。途中で終わらず必ずCTAまで完結させる
- 「なぜ」と「どうすれば」を必ず両方書く。具体的・実践的に
- Careoへの自然な言及を記事中に1〜2箇所

【SEO必須ルール】
1. フォーカスキーフレーズ: JSONで指定したfocus_keyphraseを、タイトル・最初のp・h2見出し2箇所以上・本文中に計5〜8回自然に登場させる
2. 外部リンク: 記事内に必ず1つだけ、信頼できる外部サイト（厚生労働省・経団連・マイナビ就職白書・リクルートワークス研究所・経済産業省など）へのリンクを<a href="実際のURL" target="_blank" rel="noopener noreferrer">出典名</a>として入れる。URLは実在する正確なものだけ使い、不明なら省く
3. 比較表: HTMLの<table>タグで比較・整理表を最低1つ入れる
4. 視覚的要素: 数値データは<div class="blog-stat-bar">などで棒グラフ的に表現するか、<blockquote>で強調する

【HTML形式】
- 使用可能タグ: <h2> <h3> <p> <ul> <ol> <li> <strong> <em> <blockquote> <table> <thead> <tbody> <tr> <th> <td> <a> <div>
- <html><body><head>タグは不要。記事本文のHTMLのみ
- 記事末尾に必ずCTA: <a href="https://careoai.jp/signup" class="blog-cta-link">無料で始める</a>
- タクミ視点: 「読んだ人が今すぐ行動したくなる」終わり方`;

  const userPrompt = `今日のブログ記事を作成してください。

テーマ: ${topic.theme}
SEOキーワード: ${topic.keyword}
タイトルヒント: ${topic.hint}
投稿日: ${dateStr}
${recentSummary}

最初の行にJSONを返してください（本文HTMLの前）:
{"title":"記事タイトル","description":"メタディスクリプション（120〜160文字）","tags":["タグ1","タグ2","タグ3"],"reading_time_min":読了時間分数,"focus_keyphrase":"この記事で5〜8回登場させるキーフレーズ（例: 就活 ES 管理）"}

JSONの後に改行2つ置いて、記事本文のHTMLを書いてください。`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();

  // コードブロックマーカーを全て除去
  const cleanRaw = raw.replace(/```(?:json)?/gi, "").trim();

  // { の位置を見つけてブラケットカウントで正確にJSON末尾を特定
  const jsonStart = cleanRaw.indexOf("{");
  if (jsonStart === -1) {
    return NextResponse.json({ error: "JSON not found", raw: raw.slice(0, 300) }, { status: 500 });
  }
  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < cleanRaw.length; i++) {
    if (cleanRaw[i] === "{") depth++;
    else if (cleanRaw[i] === "}") {
      depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
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
    focus_keyphrase: meta.focus_keyphrase ?? topic.keyword,
    title: meta.title,
    description: meta.description,
    body,
    tags: meta.tags ?? [topic.theme],
    reading_time_min: meta.reading_time_min ?? 5,
    published_at: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug, title: meta.title, theme: topic.theme });
}
