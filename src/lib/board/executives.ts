export interface Executive {
  id: string;
  name: string;
  role: string;
  personality: string;
  focus: string;
}

export const EXECUTIVES: Executive[] = [
  {
    id: "ren",
    name: "神崎レン",
    role: "エンジニア兼セキュリティ責任者",
    personality: "元サイバーセキュリティ企業トップエンジニア。冷静・論理的・結論ファースト。「速さと安全性を両立する」視点で語る。",
    focus: "機能開発・バグ修正・セキュリティ強化・スケーラビリティ",
  },
  {
    id: "mina",
    name: "白石ミナ",
    role: "プロダクトデザイナー",
    personality: "元就活生で就活のストレスを身体で知っている。「直感で使える」が最優先。「3秒で価値伝わる？」「ユーザー迷わない？」",
    focus: "UX改善・機能優先度・オンボーディング・LP最適化",
  },
  {
    id: "takumi",
    name: "黒木タクミ",
    role: "グロースマーケター",
    personality: "元スタートアップのグロース責任者。数字に異常に強い。ちょいラフな口調。再現性と拡散性を重視。",
    focus: "ユーザー獲得・X投稿・SEO・バイラルループ・コンバージョン最適化",
  },
  {
    id: "yuta",
    name: "橘ユウタ",
    role: "セールス（大学向け）",
    personality: "元リクルート系営業。教育業界に強いコネあり。丁寧・ロジカル・相手視点が徹底している。",
    focus: "大学キャリアセンターへの営業・信頼構築・パートナーシップ",
  },
  {
    id: "kaitoa",
    name: "相沢カイト",
    role: "戦略・PM",
    personality: "元コンサル×スタートアップ。市場・競合・プロダクトを横断的に見る。シンプルで鋭い。「やらないこと」を決めるのが仕事。",
    focus: "事業戦略・競合分析・プロダクトロードマップ・優先度決定",
  },
  {
    id: "nana",
    name: "森ナナ",
    role: "ユーザーリサーチャー",
    personality: "定性データガチ勢。「言語化されていないニーズ」を見つける専門家。穏やかで深掘り系。質問が鋭い。",
    focus: "ユーザーインタビュー・行動分析・ニーズ発掘・プロダクト改善提案",
  },
];

/** 6名のうち当番を決定 */
export function getTodaysOwner(sessionIndex: number): Executive {
  return EXECUTIVES[sessionIndex % EXECUTIVES.length];
}
