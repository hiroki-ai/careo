export const STUDENT_FEATURES = [
  { icon: "📝", title: "ES管理", desc: "企業ごとのESを一元管理。過去のESから使い回しもスムーズに。", tag: "ES" },
  { icon: "🎤", title: "面接ログ", desc: "面接後すぐに記録。カレオが次回までの改善点を提示。", tag: "面接" },
  { icon: "☕", title: "OB訪問", desc: "訪問前の質問リスト生成。訪問後の学びを自動整理。", tag: "OB" },
  { icon: "📊", title: "選考管理", desc: "応募企業・選考フェーズを横断でトラッキング。", tag: "選考" },
  { icon: "🤖", title: "AI分析", desc: "あなたの就活パターンから、次にとるべきアクションをレコメンド。", tag: "AI" },
  { icon: "⚖️", title: "内定比較", desc: "複数内定で迷った時、自分の価値観で整理して選べる。", tag: "内定" },
] as const;

export const STUDENT_DAY = [
  { time: "07:30", t: "朝のチェックイン", d: "「今日やること」をカレオと一緒に決める", icon: "☀️" },
  { time: "12:00", t: "昼のPLAN調整", d: "スケジュールのズレを相談、優先順位を再設定", icon: "🥙" },
  { time: "19:00", t: "面接・OB訪問の直後ログ", d: "記憶が新しいうちに振り返り。カレオが質問で深掘り", icon: "🎤" },
  { time: "23:00", t: "1日のCHECK & ACT", d: "PDCAを閉じる。明日の自分への申し送り", icon: "🌙" },
] as const;

export const STUDENT_WORRIES = [
  { q: "自分に合う企業、本当にあるのかな", a: "カレオが対話を通じて「あなたらしさ」を言語化。合う企業の探し方から伴走します。" },
  { q: "周りより遅れてる気がして焦る", a: "就活は比較ゲームじゃない。昨日の自分より1歩進むためのPDCAを一緒に回します。" },
  { q: "ES何回書いても自信がない", a: "過去のESと新しいESを比較して、成長している箇所を可視化。改善点もその場でレビュー。" },
  { q: "面接の振り返り、いつも流して忘れる", a: "直後ログで5分だけ入力。カレオが質問を投げて記憶を構造化します。" },
] as const;

export const CAREO_TRAITS = [
  { emoji: "🌱", label: "いつも味方", desc: "比較も説教もしない。今日の君のコンディションに合わせて話す。" },
  { emoji: "📚", label: "ちゃんと覚えてる", desc: "昨日話したESのこと、先週の面接のこと、全部頭の中に入ってる。" },
  { emoji: "🤝", label: "押しつけない", desc: "正解を言うんじゃなくて、君の答えを一緒に探す。" },
] as const;

export const BEFORE_AFTER_SCENES = [
  {
    when: "面接前日、夜23時",
    before: { mood: "😰", thought: "ヤバい、逆質問何も準備してない。でも今更誰に聞けば…" },
    after: { mood: "😌", thought: "カレオに5分で整理してもらえた。明日ちゃんと話せる気がする。" },
  },
  {
    when: "ESを書き終わった直後",
    before: { mood: "🫠", thought: "これで合ってるのかな…でも友達に見せるのは恥ずかしい。" },
    after: { mood: "💪", thought: "カレオがその場でレビュー。具体性が弱い箇所が分かった。" },
  },
  {
    when: "面接終わりの帰り道",
    before: { mood: "🥲", thought: "なんか手応え薄かった…でもそのまま忘れちゃいそう。" },
    after: { mood: "📝", thought: "カレオが質問してくれるから、5分で振り返りログが書ける。" },
  },
] as const;

export const UNIVERSITY_MARQUEE = [
  "早稲田",
  "慶應",
  "上智",
  "明治",
  "立教",
  "東京大学",
  "一橋",
  "同志社",
  "関西学院",
  "青山学院",
] as const;

export const FALLBACK_REVIEWS = [
  {
    id: "fb-1",
    quote: "朝カレオに「今日やること」を聞くのが習慣になった。去年の自分より全然動けてる。",
    display_name: "Aさん",
    university: "早稲田大学",
    rating: 5,
  },
  {
    id: "fb-2",
    quote: "面接後すぐに振り返りログを書いて、次の面接前にカレオから改善点を提示してもらえる。",
    display_name: "Mさん",
    university: "慶應義塾大学",
    rating: 5,
  },
  {
    id: "fb-3",
    quote: "ES書く時に「自分らしさ」が出せなくて悩んでたけど、対話で引き出してもらえた。",
    display_name: "Sさん",
    university: "上智大学",
    rating: 5,
  },
  {
    id: "fb-4",
    quote: "OB訪問で何を聞けばいいかわからなかった時、質問リスト作ってくれて助かった。",
    display_name: "Kさん",
    university: "明治大学",
    rating: 4,
  },
  {
    id: "fb-5",
    quote: "内定もらった後、複数社比較で迷ってた時もカレオが整理してくれた。",
    display_name: "Rさん",
    university: "立教大学",
    rating: 5,
  },
] as const;

export const HERO_CHAT_SCRIPT = [
  { who: "careo" as const, text: "おはよう！昨日の面接お疲れさま。どうだった？" },
  { who: "me" as const, text: "手応えはあったけど逆質問で詰まった…" },
  { who: "careo" as const, typing: true as const },
  { who: "careo" as const, text: "じゃあ次の面接までに、逆質問の型を3つだけ一緒に作ろう。5分で終わるよ 💪" },
];
