/**
 * X（Twitter）半自動運用用の投稿テンプレ。
 * /admin/x-drafts で曜日・時間帯ごとに自動ローテーション表示。
 * 投稿は手動（AI APIを使わず、固定テンプレから選ぶだけ）。
 */

export type XCategory = "morning" | "deadline" | "tip" | "story" | "career_data" | "community";

export interface XTemplate {
  id: string;
  category: XCategory;
  text: string; // 140字以内推奨
  variables?: string[]; // {{ }} 内の変数名（動的置換用）
  tags?: string[];
}

// 毎朝の「今日やること」テンプレ（曜日別）
export const MORNING_TEMPLATES: XTemplate[] = [
  {
    id: "morning-mon-1",
    category: "morning",
    text: "月曜の朝。今週のES締切を確認するだけで、週末の焦りが激減する。\n\nCareoで締切を一元管理すると『気づいたら過ぎてた』がなくなる。\n\n今週の動きを1分で整理しよう 👇\ncareoai.jp",
  },
  {
    id: "morning-tue-1",
    category: "morning",
    text: "火曜の朝。先週の面接、まだ振り返ってない？\n\n記憶が残ってるうちに5分で面接ログを書くと、次の面接の通過率が明確に上がる。\n\n実際のデータでもそう出てる 📊",
  },
  {
    id: "morning-wed-1",
    category: "morning",
    text: "水曜の朝。「今週何すべきか分からない」って人へ。\n\nCareoで3分の就活診断すると、タイプ別の次の一手が見える。\n\ncareoai.jp/diagnosis",
  },
  {
    id: "morning-thu-1",
    category: "morning",
    text: "木曜の朝。サマーインターンの締切、6月末〜7月頭に集中してる。\n\n今のうちに応募リストを作っておくと、後半でバタバタしない。",
  },
  {
    id: "morning-fri-1",
    category: "morning",
    text: "金曜の朝。週末を使った自己分析、今日の朝に方針だけ決めておくと効く。\n\n目的なしに自己分析本を読むより、過去のESから振り返る方が実践的。",
  },
];

// ES添削チャレンジ用テンプレ
export const ES_CHALLENGE_TEMPLATES: XTemplate[] = [
  {
    id: "es-challenge-call",
    category: "tip",
    text: "【週1 ES添削チャレンジ】\n匿名でいいのでESを送ってくれたら、Careoのデータを踏まえて公開添削します。\n\nテーマ: {{theme}}\n送り先: {{dm_target}}\n\n#就活生と繋がりたい",
    variables: ["theme", "dm_target"],
  },
  {
    id: "es-challenge-result",
    category: "tip",
    text: "【公開添削 #{{number}}】\n\nBefore: 「{{before_point}}」\nAfter:  「{{after_point}}」\n\n改善ポイント：{{key_point}}\n\n通過ESの共通点は『具体 × 数字 × 学び』。",
    variables: ["number", "before_point", "after_point", "key_point"],
  },
];

// 就活Tips（アクションにつながる知識）
export const TIP_TEMPLATES: XTemplate[] = [
  {
    id: "tip-gakuchika-depth",
    category: "tip",
    text: "ガクチカで通る人の共通点、データで見ると一つ。\n\n『エピソード』じゃなく『思考プロセス』を書いてる。\n\n何を見て、何を考えて、何を選んだか。\n結果より過程が評価される。",
  },
  {
    id: "tip-reverse-question",
    category: "tip",
    text: "逆質問で差がつく瞬間。\n\nNG: 「御社の強みは何ですか？」（調べれば分かる）\nOK: 「〇〇事業、5年後にXXになる可能性を感じたのですが、社内での議論はありますか？」\n\n仮説を入れるだけで別次元の印象。",
  },
  {
    id: "tip-fail-pattern",
    category: "tip",
    text: "ESで落ちるパターン、実はほぼ3つに収まる。\n\n1. 具体性がない\n2. 自己分析と志望動機が繋がってない\n3. 文字数を埋めるだけの文章\n\n自分がどれか分かると改善は早い。Careoで過去ESを並べると一発で見える。",
  },
  {
    id: "tip-ob-visit-check",
    category: "tip",
    text: "OB訪問で差がつくのは質問の量じゃなく、質問の『深さ』。\n\n一番効くのは『入社前後のギャップ』。入社前に思ってたこと vs 実際。\n\nここで聞いた話は志望動機の核になる。",
  },
  {
    id: "tip-case-prep",
    category: "tip",
    text: "ケース面接、独学だと一生上手くならない。\n\n理由: 自分の思考の穴は他人にしか見えない。\n\n対策: 同じケースを3人に解かせてもらう→比較する、が圧倒的に効く。無料でやれる方法。",
  },
];

// 開発者ストーリー（Build in Public）
export const STORY_TEMPLATES: XTemplate[] = [
  {
    id: "story-build-in-public-1",
    category: "story",
    text: "28卒の自分が、自分のために作った就活アプリがCareoです。\n\n今日時点のユーザー数・Pro加入・蓄積データは全公開してます👇\ncareoai.jp/stats",
  },
  {
    id: "story-why-data",
    category: "story",
    text: "就活がしんどい一番の理由は『進んでる気がしない』こと。\n\nES何通書いたか・面接何回受けたか・通過率は・業界別の勝率は？\n全部Careoで見える化した瞬間、焦りが計画に変わった。",
  },
  {
    id: "story-alone",
    category: "story",
    text: "個人開発だからできることがある。\n\n大手就活サイトは企業からお金をもらう構造上、学生のための設計が難しい。Careoは学生課金（¥480）と広告だけで回す予定。\n\nだから学生のためだけに最適化できる。",
  },
  {
    id: "story-founder-logs",
    category: "story",
    text: "【開発ログ】\n\n今日やったこと: {{today}}\n明日やること: {{tomorrow}}\n今週のユーザー数: {{mau}}\n\n就活生でもある自分が、毎日Careoを使いながら育ててる。",
    variables: ["today", "tomorrow", "mau"],
  },
];

// 就活データ（集合知系）
export const DATA_TEMPLATES: XTemplate[] = [
  {
    id: "data-offer-rate",
    category: "career_data",
    text: "28卒・平均応募数22社・内定率65%（マイナビ調査）。\n\nつまり『22社応募しても3社に1社落ちる』のが普通。\n\n落ちて当然、数で勝負。これを知ってるだけでメンタルが安定する。",
  },
  {
    id: "data-time-wasted",
    category: "career_data",
    text: "就活で一番時間を溶かすのは『同じ質問に何回も答えるES作業』。\n\n過去ESをCareoに保存しておくと、新しいESは10分で書ける。\n\nゼロから書くのは最初の3社だけでいい。",
  },
];

// コミュニティ（巻き込み・交流）
export const COMMUNITY_TEMPLATES: XTemplate[] = [
  {
    id: "community-ask",
    category: "community",
    text: "28卒の皆さんに質問。\n\n今一番しんどいのは？👇\n1. 何から始めるか分からない\n2. ESが通らない\n3. 面接が怖い\n4. 軸が決まらない\n\n数字で教えてください、一番多いやつをネタに記事書きます",
  },
  {
    id: "community-call-senpai",
    category: "community",
    text: "27卒の先輩、内定取れた人いたら、CareoでES・面接ログを匿名共有してほしい。\n\n後輩29卒・30卒が見て本当に助かる。\n\ncareoai.jp/senpai で公開できる。",
  },
];

export const ALL_TEMPLATES: XTemplate[] = [
  ...MORNING_TEMPLATES,
  ...ES_CHALLENGE_TEMPLATES,
  ...TIP_TEMPLATES,
  ...STORY_TEMPLATES,
  ...DATA_TEMPLATES,
  ...COMMUNITY_TEMPLATES,
];

export const CATEGORY_LABELS: Record<XCategory, string> = {
  morning: "毎朝投稿",
  deadline: "締切情報",
  tip: "就活Tips",
  story: "ストーリー",
  career_data: "データ",
  community: "巻き込み",
};

/**
 * 曜日・時間帯から「今おすすめのテンプレ」を返す。
 */
export function recommendedToday(): XTemplate[] {
  const now = new Date();
  const day = now.getDay(); // 0=日
  const hour = now.getHours();

  const picks: XTemplate[] = [];

  // 朝（6-10時）: morning
  if (hour >= 6 && hour < 11) {
    const morningByDay = MORNING_TEMPLATES.filter((t, i) => i === day % MORNING_TEMPLATES.length);
    picks.push(...morningByDay);
  }

  // 昼（11-14時）: tip
  if (hour >= 11 && hour < 15) {
    picks.push(TIP_TEMPLATES[day % TIP_TEMPLATES.length]);
  }

  // 夜（18-22時）: story or community
  if (hour >= 18 && hour < 23) {
    picks.push(STORY_TEMPLATES[day % STORY_TEMPLATES.length]);
    picks.push(COMMUNITY_TEMPLATES[day % COMMUNITY_TEMPLATES.length]);
  }

  // 時間帯に関わらず ES challenge を金曜に
  if (day === 5) {
    picks.push(...ES_CHALLENGE_TEMPLATES);
  }

  return picks.filter(Boolean);
}
