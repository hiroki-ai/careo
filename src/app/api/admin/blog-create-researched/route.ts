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
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
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

  // ==============================
  // 28卒就活スケジュール 調査済みデータ（Perplexity調査 + 手動補正）
  // ==============================
  const researchNotes = `
【重要な前提・事実確認済み情報】
対象: 28卒（2028年3月卒業予定）の学部生
学年対応（28卒の場合）:
  - 2024年4月: 大学1年生入学
  - 2025年4月: 大学2年生
  - 2026年4月: 大学3年生 ← ここが就活の本番スタート時期
  - 2027年4月: 大学4年生
  - 2028年3月: 卒業

【公式ルール（28卒）】
- 広報活動開始: 2027年3月1日（ナビサイト公開・エントリー受付）
- 選考活動開始: 2027年6月1日（面接解禁）
- 正式内定日: 2027年10月1日
- ただし実務では大幅に前倒しが進んでいる

【全体スケジュール（時系列）】

2026年4月（大学3年春）:
- 就活イベント: 28卒向け合同企業説明会・業界研究フェア開始（キャリタス就活フォーラムなど）
- 企業側: 28卒採用チーム立ち上げ、オープン・カンパニー企画
- 学生: 就活情報収集開始、自己分析のきっかけづくり
- 重要度: ★★

2026年5月（大学3年）:
- 企業側: 夏〜秋のオープン・カンパニー・1day仕事体験の設計
- 学生: 興味業界の粗いリストアップ、OB/OG訪問の初回実施
- 重要度: ★★

2026年6月（大学3年）:
- 就活イベント: 28卒向けサマーインターン選考開始（特に外資・メガベンチャー・一部金融）
- 企業側事例: サイバーエージェントの超早期内定直結インターン（6月実施）
- 学生: ES・Webテストの初経験、インターン応募ピーク
- 重要度: ★★★

2026年7〜8月（大学3年夏）:
- サマーインターン本番（金融・IT・メガベンチャーなど）
- 企業側: タレントプール登録、母集団形成
- 重要度: ★★★

2026年9月（大学3年）:
- サマーインターン後半、秋冬インターン案内開始
- 優秀層への囲い込み準備
- 重要度: ★★★

2026年10〜11月（大学3年秋）:
- 秋インターン・1day仕事体験募集開始
- 外資コンサル・投資銀行のケース面接型イベント
- OB/OG訪問が増加
- 重要度: ★★★★

2026年12月〜2027年1月（大学3年冬）:
- 冬インターン本番（1〜2月）
- 外資・メガベンチャー・メガバンク系で早期選考案内が出始める
- 重要度: ★★★★★

2027年2月（大学3年）:
- 冬インターン後半
- 広報開始（3/1）に向けた採用サイト最終更新
- インターン参加者へのフォロー（早期選考への誘導）
- 重要度: ★★★★★

2027年3月（大学3年3月 = 就活解禁）:
- 政府ルール上の広報活動開始日（3/1）
- ナビサイト公開・エントリー受付・会社説明会受付開始
- 専門活用型インターン参加者は3月以降に選考移行可能
- 重要度: ★★★★★

2027年4月〜5月（大学4年春）:
- 会社説明会・座談会のピーク
- ES提出・Webテスト本格化
- 外資・ベンチャーの一部はすでに本選考実施
- 重要度: ★★★★★

2027年6月（大学4年）:
- 政府ルール上の選考活動解禁（6/1〜）
- 大手企業の面接ラッシュ
- 26卒・27卒実績: このタイミングで内定率80%超のデータあり
- 重要度: ★★★★★

2027年7〜9月（大学4年夏〜秋）:
- 本選考ピーク継続
- 9月: 第二陣本選考・秋採用
- 重要度: ★★★★★

2027年10月（大学4年）:
- 正式内定日（10/1）以降に内定式
- 重要度: ★★★★

【企業タイプ別】
- 外資系（コンサル・IB等）: 3年秋〜冬インターン選考→本選考は3〜5月前倒し→内定は3年夏〜秋インターン経由で早期。ケース面接・英語面接が特徴
- 日系大手（経団連系）: 広報3/1〜、面接6/1〜が基本。インターン評価活用の早期選考ルート整備中
- メガベンチャー（楽天・サイバーエージェント等）: 3年サマー・秋冬インターンから選考直結。インターン経由で3年夏〜冬に超早期内定
- スタートアップ: 通年採用色が強く、長期インターンからそのまま内定のケースが多い

【実際の企業事例】
1. リクルートホールディングス: 「THE STORMING 2026」(選考直結インターン) 2026年3月3日エントリー受付開始。インターン→早期選考ルートが強い
2. 楽天グループ: 「Rakuten Summer Internship」毎年7月締切で8〜9月実施。エンジニア28卒向けも春頃に選考案内予定
3. サイバーエージェント: 「超早期内定直結型インターンシップ」は2026年2月〜3月ES受付→6月3daysインターン→2年生相当の段階で内々定が出るケースも
4. 三菱UFJ信託銀行: 「28卒向けインターン」2026年3月13日〜6月4日エントリー受付。5days「TRUST TO LAST」8月上旬〜9月実施
5. PwCコンサルティング/Strategy&: 「春インターンシップ2028卒」ES締切5月31日、6月21〜23日実施。ケース面接経由の早期本選考あり
6. SmartHR: 「サマーインターンシップ2026（ビジネス）2028年4月入社向け」を2026年夏に開催予定。長期インターン→内定ルートが特徴

【最新トレンド（2026年時点）】
- 就活の早期化: 売り手市場継続（大卒求人倍率1.66倍、中小8.98倍 vs 大企業0.34倍）
- インターン=選考入口の標準化: 専門活用型インターン（2週間以上）経由で3月より前の選考移行が政府ルールで認められた
- AI活用の急拡大: 25卒37.2%→26卒66.6%が就活でAI利用。ES推敲(56.6%)・ES作成(41.7%)・自己分析(28.8%)が上位
- 選考形式: 26卒の97.1%がオンラインを取り入れた選考を希望。一次面接はWEB79.3%、最終面接は対面85.0%のハイブリッド主流
- 内定時期の前倒し: 25卒9月1日時点の内定率94.2%。公式解禁日より前の内定取得が一般的に
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
