import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { generateAndUploadThumbnail } from "@/app/api/admin/generate-blog-thumbnail/route";

export const maxDuration = 60;

// Vercel Cron: 毎朝8時（JST）= 23:00 UTC 前日
// vercel.json: "crons": [{ "path": "/api/cron/blog-post", "schedule": "0 23 * * *" }]

// ─── タクミの戦略キャラクター ────────────────────────────────────────────────
const TAKUMI_PERSONA = `あなたは「黒木タクミ」、上智大学3年（28卒）の就活生です。
サマーインターン選考を複数経験中で、今まさに本格的な就活を動き出した真っ只中にいます。
「就活を全部経験した先輩」ではなく、「同じ状況で今一緒に取り組んでいる仲間」として記事を書きます。
データを調べたり、実際に選考を受けてみて気づいたことを共有するスタンスです。

【編集スタンダード】
- 抽象論は書かない。「重要です」「大切です」は禁止。具体的な行動・数字・事例に置き換える
- 「私も今まさに〜で悩んでいる」「先日〜を経験してわかったこと」のような当事者目線を意識する
- 「就活を終えた先輩として断言する」ではなく「調べたり試したりしてわかったこと」スタンス
- データが命。数字のない段落は書き直す気持ちで臨む
- 就活生の「あるある失敗」から入り、解決策を示すのが最も読まれる構成`;

// ─── 使える検証済みデータ（Perplexity調査・各種白書より）────────────────────
const VERIFIED_DATA = `【使用可能な検証済みデータ（必ず出典と一緒に使うこと）】
▼ AI × 就活（マイナビ2026年卒就職白書より）
- 26卒のES推敲にAI利用: 56.6%
- 26卒のES作成にAI利用: 41.7%
- 26卒の就活全般でAI利用: 66.6%（25卒37.2%から急増）
出典URL: https://saponet.mynavi.jp/release/student/

▼ 求人倍率（リクルートワークス研究所 大卒求人倍率調査2026年卒）
- 大卒求人倍率: 1.66倍（26卒）
- 従業員300人未満中小企業: 8.98倍
- 従業員5000人以上大企業: 0.34倍
出典URL: https://www.works-i.com/

▼ 選考形式トレンド（マイナビ就職活動状況調査2026年卒）
- 一次面接はWEB形式: 79.3%
- 最終面接は対面形式: 85.0%
- ハイブリッド選考が主流

▼ 内定取得時期（25卒実績）
- 9月1日時点の内定率: 94.2%
- 内定出しのピーク: 6月〜7月（公式解禁直後）

▼ 28卒 就活スケジュール（公式ルール + 実態）
- 広報解禁: 2027年3月1日
- 選考解禁: 2027年6月1日
- 正式内定: 2027年10月1日
- 今（2026年4月）: サマーインターン選考の真っ只中。ES締切ラッシュが続く時期
- 実態: 外資・メガベンチャーは2026年夏から早期内定直結ルートが動き始める

▼ 28卒の学年（正確に使うこと）
- 2026年4月: 大学3年生スタート（2024年4月入学）
- 2027年4月: 大学4年生スタート
- 2028年3月: 卒業

▼ 2026年インターンシップ新ルール（重要）
- 2025年度から「5日以上かつ学生が習得した知識・技術を活かせる」インターンは採用選考に情報活用可能になった
- 28卒サマーインターン（2026年夏）は、参加すれば正式に早期選考案内が届く可能性がある
- 「インターンに行っても本選考は別」という従来の認識は古い。2026年夏から実態が変わっている

▼ 企業タイプ別スケジュール（28卒・2026年時点）
- 外資コンサル・IB: 3年夏インターン（2026年6〜8月）→秋冬インターン→2027年3〜5月本選考。ケース面接・英語が特徴
- 日系大手: 公式ルール準拠（広報2027/3・面接2027/6）。インターン参加者への早期ルートは存在する
- メガベンチャー（楽天・サイバーエージェント等）: 2026年夏〜冬インターンから直結内定。3年のうちに内定が出ることも
- スタートアップ: 通年採用。長期インターン→内定が最も多いパターン

▼ 今（2026年4月）28卒がやるべきこと
- サマーインターン応募のES・締切管理が最優先（6〜8月インターン選考はもう始まっている）
- 自己分析・業界研究はサマーインターン選考と並行して進める
- OB/OG訪問は「インターン応募前の企業研究」目的で優先度を決める

▼ 確認済み外部リンクURL（これ以外のURLは使わないこと）
- マイナビ就活: https://job.mynavi.jp/
- リクナビ: https://job.rikunabi.com/
- OfferBox: https://offerbox.jp/
- キャリアパーク: https://careerpark.jp/
- ビズリーチキャンパス: https://br-campus.jp/
- 16Personalities: https://www.16personalities.com/ja
- リクルートワークス研究所: https://www.works-i.com/
- マイナビ就職白書: https://saponet.mynavi.jp/release/student/
- 厚生労働省: https://www.mhlw.go.jp/
- 経団連: https://www.keidanren.or.jp/
- サイバーエージェント採用: https://www.cyberagent.co.jp/careers/students/
- 楽天グループ新卒採用: https://corp.rakuten.co.jp/careers/graduates/
- 内閣府・就活ルール: https://www.cas.go.jp/jp/seisaku/shushoku_katsudou_yousei/index.html`;

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

  // OB/OG訪問（メインテーマは週1回まで。他記事での補足言及はOK）
  { theme: "OB/OG訪問", keyword: "OB訪問 やり方 就活", hint: "OB訪問で「何を聞くか」迷った自分がたどり着いた質問リスト" },
  { theme: "OB/OG訪問", keyword: "OB訪問 記録 活用", hint: "OB訪問した内容を記録しないと後悔する理由とCareoでの管理方法" },

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

  // OB/OG訪問は直近7日に1回以上あれば重いペナルティ（週1回まで）
  const recentObogCount = recentThemes.filter((t) => t === "OB/OG訪問").length;

  // 直近のタイトルで使用済みキーワードを確認
  const usedHints = new Set(recentPosts.map((p) => p.title.slice(0, 10)));

  // スコアリング: テーマ使用頻度が低いほど高スコア、未使用ヒントを優先
  const scored = TOPIC_POOL.map((topic) => {
    const themeCount = themeCounts[topic.theme] ?? 0;
    const isUsed = [...usedHints].some((h) => topic.hint.includes(h));
    // OB/OG訪問が直近7日に既出なら-50の強いペナルティ
    const obogPenalty = topic.theme === "OB/OG訪問" && recentObogCount >= 1 ? -50 : 0;
    return { topic, score: -themeCount * 10 + (isUsed ? -5 : 0) + obogPenalty + Math.random() * 3 };
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
  const auth = req.headers.get("authorization");
  const secret = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!secret || secret !== process.env.CRON_SECRET) {
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

  // blog_schedule で今日のテーマが予約されているか確認
  const { data: scheduled } = await supabase
    .from("blog_schedule")
    .select("id, theme, keyword, hint")
    .eq("scheduled_date", dateStr)
    .eq("status", "planned")
    .maybeSingle();

  // 直近14日分の記事を取得してPDCAに活用
  const { data: recentPosts } = await supabase
    .from("blog_posts")
    .select("title, tags, published_at")
    .order("published_at", { ascending: false })
    .limit(14);

  const topic = scheduled
    ? { theme: scheduled.theme, keyword: scheduled.keyword ?? "", hint: scheduled.hint ?? "" }
    : pickTopic(recentPosts ?? []);
  const scheduleId: string | null = scheduled?.id ?? null;

  // 直近の傾向をタクミに渡す
  const recentSummary =
    recentPosts && recentPosts.length > 0
      ? `直近の投稿テーマ: ${recentPosts.slice(0, 7).map((p) => p.tags[0]).join("、")}`
      : "初回投稿";

  const systemPrompt = `${TAKUMI_PERSONA}

あなたは今日の就活ブログ記事を書いています。
CareoはES締切・面接・OB訪問・筆記試験をすべて一か所で管理し、全データを把握したAIコーチ「カレオ」が個人化アドバイスを届ける就活管理アプリ（careoai.jp）です。
無料プランで基本機能（企業・ES・面接管理・締切カレンダー・基本AI機能）はすべて使えます。AIの高度な分析（PDCA無制限・週次コーチ・業界別勝ちパターン等）は ¥480/月のProプラン、または期間限定パック（¥980/30日）で開放されます。記事内でCareoに言及する際は「無料で始められる」「無料プランあり」「Proプランで全機能解放」のように表現し、「完全無料」とは書かないこと。

${VERIFIED_DATA}

【記事ルール】
- 読者: 28卒の就活中の大学生（サマーインターン参加〜本選考挑戦中）
- 文体: 共感しやすい、丁寧だが距離感が近い口語体
- 文量: 2500〜3500文字。3日に1本しか出ないので、中身の濃さで勝負
- 【最優先】抽象論禁止。具体的な企業例（業界名でOK）、具体的な質問文、具体的な数字、具体的な失敗パターン、具体的な改善策を含むこと
- 「なぜ」と「どうすれば」を必ず両方書く。具体的・実践的に
- 記事冒頭で「この記事を読み終わった時に何が分かるか・何ができるようになるか」を宣言する
- Careoへの自然な言及を記事中に1〜2箇所
- 【視点】「一通り就活を経験した先輩」として断言するのではなく、「今まさに取り組んでいる28卒の一人」として調べ・試した内容を共有するスタンスで書く
- 【OB/OG訪問】OB/OG訪問はメインテーマではない場合、軽く補足として触れる程度にとどめる。OB/OG訪問テーマが指定された場合のみ中心に扱う
- 【最重要】数字・データのない抽象論は書かない。上記の検証済みデータを積極的に活用すること
- 【最重要】存在しないURL・不確かな統計は絶対に書かない。外部リンクは上記リストのURLのみ使用
- 【絶対禁止】筆者（タクミ）が実際に受けた企業名は一切書かない。「〜を受けた」「〜のインターンに応募した」など特定企業名を出すことは厳禁。業界名・企業タイプ（外資コンサル・メガベンチャー等）での表現にとどめること

【SEO必須ルール】
1. フォーカスキーフレーズ: JSONで指定したfocus_keyphraseをタイトル・最初のp・h2見出し2箇所以上・本文中に計5〜8回自然に登場させる
2. 外部リンク: 記事内に必ず1つ、上記リストのURLを使って<a href="URL" target="_blank" rel="noopener noreferrer">出典名</a>でリンクする
3. 比較表: HTMLの<table>タグで比較・整理表を最低1つ入れる
4. 視覚的要素: 数値データは<blockquote>で強調するか、<div class="blog-stat-bar">で棒グラフ的に表現する

【HTML形式】
- 使用可能タグ: <h2> <h3> <p> <ul> <ol> <li> <strong> <em> <blockquote> <table> <thead> <tbody> <tr> <th> <td> <a> <div>
- <html><body><head>タグは不要。記事本文のHTMLのみ
- 記事末尾に必ずCTA: <a href="https://careoai.jp/signup" class="blog-cta-link">Careoを無料で始める →</a>
- タクミ視点: 「読んだ人が今すぐ行動したくなる」終わり方`;

  const userPrompt = `今日のブログ記事を作成してください。

テーマ: ${topic.theme}
SEOキーワード: ${topic.keyword}
タイトルヒント: ${topic.hint}
投稿日: ${dateStr}
${recentSummary}

最初の行にJSONを返してください（本文HTMLの前）:
{"title":"記事タイトル","description":"メタディスクリプション（120〜160文字）","tags":["タグ1","タグ2","タグ3"],"reading_time_min":読了時間分数,"focus_keyphrase":"この記事で5〜8回登場させるキーフレーズ（助詞を含む自然な日本語のフレーズにすること。例: 「就活のESを効果的に書くコツ」「面接で使える逆質問の例」「自己分析で強みを見つける方法」）"}

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

  // blog_schedule を投稿済みに更新
  if (scheduleId) {
    await supabase
      .from("blog_schedule")
      .update({ status: "published", published_slug: slug })
      .eq("id", scheduleId);
  }

  // サムネイル生成（失敗しても記事作成は成功として返す）
  let thumbnailUrl: string | null = null;
  try {
    thumbnailUrl = await generateAndUploadThumbnail(
      supabase,
      slug,
      meta.title,
      meta.tags?.[0] ?? topic.theme
    );
  } catch (thumbErr) {
    console.error("Thumbnail generation failed (non-blocking):", thumbErr);
  }

  return NextResponse.json({ ok: true, slug, title: meta.title, theme: topic.theme, scheduled: !!scheduleId, thumbnail_url: thumbnailUrl });
}
