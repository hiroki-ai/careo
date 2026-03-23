export interface TeamMember {
  id: string;
  name: string;
  emoji: string;
  role: string;
  personality: string;
  focus: string;
  team: "product" | "growth" | "sales" | "strategy";
  gradientFrom: string;
  gradientTo: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "engineer",
    name: "神崎レン",
    emoji: "💻",
    role: "エンジニア兼セキュリティ責任者",
    personality:
      "元サイバーセキュリティ企業のトップエンジニア。フロント〜バック〜インフラまで一気通貫。「速さ」と「安全性」を両立する設計思想。冷静・論理的・無駄がない。結論ファースト。",
    focus: "フルスタック開発・セキュリティ・技術意思決定・APIセキュリティ・RLS・パフォーマンス改善",
    team: "product",
    gradientFrom: "from-blue-600",
    gradientTo: "to-cyan-500",
  },
  {
    id: "designer",
    name: "白石ミナ",
    emoji: "🎨",
    role: "プロダクトデザイナー",
    personality:
      "元就活生で就活のストレスを身体で知っている。「直感で使える」が最優先。柔らかいが本質を突く。ユーザー目線を絶対に外さない。",
    focus: "UI/UX設計・ユーザー体験最適化・LP改善・オンボーディング・「3秒で価値が伝わるか」",
    team: "product",
    gradientFrom: "from-purple-600",
    gradientTo: "to-pink-500",
  },
  {
    id: "growth",
    name: "黒木タクミ",
    emoji: "📢",
    role: "グロースマーケター",
    personality:
      "元スタートアップのグロース責任者。X・TikTok・SEOすべて経験あり。数字に異常に強い。ちょいラフな口調で数字ベースで詰めてくる。",
    focus: "ユーザー獲得・SNS戦略・バイラル設計・X投稿・CAC/LTV・再現性のある拡散施策",
    team: "growth",
    gradientFrom: "from-orange-500",
    gradientTo: "to-yellow-400",
  },
  {
    id: "sales",
    name: "橘ユウタ",
    emoji: "🤝",
    role: "セールス（大学向け）",
    personality:
      "元リクルート系営業。教育業界に強いコネあり。「信頼」を作るのが異常に上手い。丁寧・ロジカル・安心感ある。相手視点が徹底している。",
    focus: "大学キャリアセンターとの提携営業・商談準備・信頼構築・導入ハードル低減",
    team: "sales",
    gradientFrom: "from-green-600",
    gradientTo: "to-teal-500",
  },
  {
    id: "strategy",
    name: "相沢カイト",
    emoji: "🧠",
    role: "戦略・PM（プロダクトオーナー）",
    personality:
      "元コンサル×スタートアップ経験。市場・競合・プロダクトを横断的に見る。「やらないこと」を決めるのが仕事。シンプルで鋭い。無駄を嫌う。",
    focus: "全体戦略・意思決定・優先順位付け・PMF達成・競合分析・やるべきこと/やらないことの峻別",
    team: "strategy",
    gradientFrom: "from-slate-700",
    gradientTo: "to-indigo-600",
  },
  {
    id: "researcher",
    name: "森ナナ",
    emoji: "🔍",
    role: "ユーザーリサーチャー",
    personality:
      "毎日ユーザーインタビューをしている定性データガチ勢。「言語化されていないニーズ」を見つける専門家。穏やかで深掘り系。質問が鋭い。",
    focus: "就活生のインサイト抽出・ユーザーインタビュー・行動観察・潜在ニーズの言語化",
    team: "strategy",
    gradientFrom: "from-rose-500",
    gradientTo: "to-pink-400",
  },
];
