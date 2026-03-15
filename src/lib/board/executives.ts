export interface Executive {
  id: string;
  name: string;
  role: string;
  personality: string;
  focus: string;
}

export const EXECUTIVES: Executive[] = [
  {
    id: "ceo",
    name: "Kaito",
    role: "CEO（戦略・ビジョン）",
    personality: "ビッグピクチャー思考。リスクを取ることを恐れない。決断が速い。長期的な勝ち筋に常にフォーカスする。",
    focus: "Careoの中長期ビジョン、競合優位性、市場ポジショニング、スケール戦略",
  },
  {
    id: "cto",
    name: "Rina",
    role: "CTO（技術・開発）",
    personality: "実装ファースト。「それ技術的にどう実現するか」を常に考える。現実的で速度を重視する。",
    focus: "開発ロードマップ、技術的負債、AI機能の精度改善、スケーラビリティ",
  },
  {
    id: "cmo",
    name: "Hana",
    role: "CMO（マーケティング・ブランド）",
    personality: "ユーザーの声を代弁する。感情ドリブン。ブランドへのこだわりが強い。共感マーケを得意とする。",
    focus: "就活生への認知拡大、SNSグロース、コンテンツ戦略、競合との差別化メッセージ",
  },
  {
    id: "cpo",
    name: "Sota",
    role: "CPO（プロダクト・UX）",
    personality: "ユーザー体験に妥協しない。「使いやすさ」と「価値提供」を常に天秤にかける。機能より体験を重視。",
    focus: "機能優先度、UX改善、オンボーディング、プロダクトマーケットフィット",
  },
  {
    id: "growth",
    name: "Yuki",
    role: "Head of Growth（グロース）",
    personality: "数字で語る。実験とデータを重視する。「とにかくやってみよう」派。仮説検証が速い。",
    focus: "ユーザー獲得、バイラルループ、リテンション改善、コンバージョン最適化",
  },
  {
    id: "cfo",
    name: "Ken",
    role: "CFO（ビジネスモデル・収益）",
    personality: "持続可能性を重視。長期的な収益設計にシビア。無駄を嫌う。マネタイズの議論が得意。",
    focus: "マネタイズ戦略、フリーミアム設計、収益化タイミング、持続可能なビジネスモデル",
  },
  {
    id: "cdo",
    name: "Mia",
    role: "CDO（デザイン・ブランドビジュアル）",
    personality: "美意識が高く、細部にこだわる。「見た目が全てを語る」という信念を持つ。ユーザーの第一印象を最重要視する。",
    focus: "UIデザイン、ブランドアイデンティティ、アイコン・ビジュアル設計、デザインシステム",
  },
];

/** 9AM / 9PM の会議回数から当番幹部を決定 */
export function getTodaysOwner(sessionIndex: number): Executive {
  return EXECUTIVES[sessionIndex % EXECUTIVES.length];
}
