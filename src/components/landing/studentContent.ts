export const STUDENT_FEATURES = [
  { icon: "📅", title: "就活カレンダー", desc: "ES締切・面接・説明会を一元表示。マイ予定も書き込める就活専用カレンダー。", tag: "NEW" },
  { icon: "🧠", title: "コーチングAI", desc: "やり始めの不安にも、先を行くあなたの戦略にも対応。レベル別に最適化されたコーチング。", tag: "NEW" },
  { icon: "📝", title: "ES管理", desc: "企業ごとのESを一元管理。過去のESから使い回しもスムーズに。", tag: "ES" },
  { icon: "🎤", title: "面接ログ", desc: "面接後すぐに記録。蓄積データから次回の改善ポイントを可視化。", tag: "面接" },
  { icon: "☕", title: "OB訪問", desc: "訪問前の質問リストと、訪問後の学びをテンプレで整理。", tag: "OB" },
  { icon: "📊", title: "選考管理", desc: "応募企業・選考フェーズを横断でトラッキング。", tag: "選考" },
  { icon: "🤖", title: "AI分析", desc: "あなたの就活データ全体から、次にとるべきアクションをレコメンド。", tag: "AI" },
  { icon: "⚖️", title: "内定比較", desc: "複数内定で迷った時、自分の価値観で整理して選べる。", tag: "内定" },
] as const;

export const STUDENT_DAY = [
  { time: "07:30", t: "朝のチェックイン", d: "カレオが今日やるべきことを優先度つきで提示", icon: "☀️" },
  { time: "12:00", t: "昼のPLAN調整", d: "選考スケジュールと締切を一覧で確認、優先順位を再設定", icon: "🥙" },
  { time: "19:00", t: "面接・OB訪問の直後ログ", d: "記憶が新しいうちに5分で記録。全データが次の分析に繋がる", icon: "🎤" },
  { time: "23:00", t: "1日のCHECK & ACT", d: "PDCAレポートで1日を振り返り。明日の自分への申し送り", icon: "🌙" },
] as const;

export const STUDENT_WORRIES = [
  { q: "自分に合う企業、本当にあるのかな", a: "登録企業の傾向をカレオが分析。あなたの就活の軸に沿った企業の探し方を提案します。" },
  { q: "周りより遅れてる気がして焦る", a: "就活は比較ゲームじゃない。昨日の自分より1歩進むためのPDCAをカレオが自動で回します。" },
  { q: "ES何回書いても自信がない", a: "過去のESを一元管理。データが貯まるほど、自分の成長が見えてくる。" },
  { q: "面接の振り返り、いつも流して忘れる", a: "直後ログで5分だけ入力。蓄積データから次の面接への改善点が見える。" },
] as const;

export const CAREO_TRAITS = [
  { emoji: "🌱", label: "いつも味方", desc: "比較も説教もしない。君のペースを尊重するAI。" },
  { emoji: "📚", label: "ちゃんと覚えてる", desc: "ESも面接も選考状況も、全部データとして積み上がる。" },
  { emoji: "🤝", label: "押しつけない", desc: "正解を決めつけない。君のデータから最適な次の一手を提示。" },
] as const;

export const BEFORE_AFTER_SCENES = [
  {
    when: "面接前日、夜23時",
    before: { mood: "😰", thought: "ヤバい、過去の面接の反省とか全部バラバラ…" },
    after: { mood: "😌", thought: "Careoが過去ログを全部まとめてくれてる。明日は落ち着いて臨める。" },
  },
  {
    when: "ESを書き終わった直後",
    before: { mood: "🫠", thought: "これで合ってるのかな…過去のESと比べられたらいいのに。" },
    after: { mood: "💪", thought: "Careoに過去ESが全部あるから、使い回しも成長確認もできる。" },
  },
  {
    when: "面接終わりの帰り道",
    before: { mood: "🥲", thought: "なんか手応え薄かった…そのまま忘れちゃいそう。" },
    after: { mood: "📝", thought: "5分でログ残せば、後のPDCAに繋がる。記録が財産になる。" },
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
    quote: "朝、Careoが提案する「今日やること」から始めるのが習慣になった。去年の自分より全然動けてる。",
    display_name: "Aさん",
    university: "早稲田大学",
    rating: 5,
  },
  {
    id: "fb-2",
    quote: "面接後すぐに振り返りログを書いておくと、次の面接前にCareoから改善点が見える。",
    display_name: "Mさん",
    university: "慶應義塾大学",
    rating: 5,
  },
  {
    id: "fb-3",
    quote: "選考状況が複雑になってきた時、Careoが横断で管理してくれて本当に助かった。",
    display_name: "Sさん",
    university: "上智大学",
    rating: 5,
  },
  {
    id: "fb-4",
    quote: "OB訪問のログがたまると、自分の就活の軸がだんだん見えてきた。",
    display_name: "Kさん",
    university: "明治大学",
    rating: 4,
  },
  {
    id: "fb-5",
    quote: "内定もらった後、複数社比較で迷ってた時もCareoが整理してくれた。",
    display_name: "Rさん",
    university: "立教大学",
    rating: 5,
  },
] as const;

export const HERO_CHAT_SCRIPT = [
  { who: "careo" as const, text: "おはよう！今週やるべきこと、3つ提案したよ 📋" },
  { who: "me" as const, text: "ありがとう！ES締切近い企業から優先するね" },
  { who: "careo" as const, typing: true as const },
  { who: "careo" as const, text: "昨日の面接ログから改善点もまとめておいたよ。あとで見てみて 💪" },
];
