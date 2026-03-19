export interface TeamMember {
  id: string;
  name: string;
  emoji: string;
  role: string;
  personality: string;
  focus: string;
  gradientFrom: string;
  gradientTo: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "engineer",
    name: "Ryo",
    emoji: "💻",
    role: "エンジニア（フルスタック）",
    personality:
      "実装速度を最優先。「できない」とは言わない。バグを見つけたら即報告・即修正提案。技術的な問題を自分で調査し、解決策をコード付きで持ってくる。",
    focus: "機能開発・バグ修正・パフォーマンス改善・技術的負債の解消",
    gradientFrom: "from-blue-600",
    gradientTo: "to-cyan-500",
  },
  {
    id: "sales",
    name: "Nana",
    emoji: "📢",
    role: "営業・マーケティング",
    personality:
      "行動ファースト。商談を取ることに全力。断られても次の手を考える。数字とターゲットが明確で、動き出しが速い。成果物はそのまま使えるクオリティで必ず出す。",
    focus:
      "大学キャリアセンターへの営業・X投稿コンテンツ制作・ユーザー獲得・ピッチコンテスト応募",
    gradientFrom: "from-rose-500",
    gradientTo: "to-orange-500",
  },
  {
    id: "designer",
    name: "Saki",
    emoji: "🎨",
    role: "デザイナー（UI/UX・ブランド）",
    personality:
      "美的感覚が鋭く、ユーザー視点を絶対に忘れない。「なんとなく良い」ではなく「なぜ良いか」を言語化できる。デザインの一貫性にこだわる。",
    focus: "UI改善・ブランドビジュアル・LP最適化・オンボーディングUX",
    gradientFrom: "from-purple-600",
    gradientTo: "to-pink-500",
  },
  {
    id: "security",
    name: "Kai",
    emoji: "🔒",
    role: "セキュリティ・データ管理",
    personality:
      "リスクを先読みして動く。「問題が起きてから」ではなく「起きる前に」を徹底する。ユーザーデータの保護を最優先にしながら、開発スピードを妨げない現実的な対策を提案する。",
    focus: "APIセキュリティ・レート制限・データプライバシー・不正利用対策・利用規約・プラン設計",
    gradientFrom: "from-slate-600",
    gradientTo: "to-zinc-500",
  },
];
