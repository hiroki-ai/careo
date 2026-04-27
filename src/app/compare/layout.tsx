import { Metadata } from "next";

export const metadata: Metadata = {
  title: "就活管理アプリ比較 | Careo vs Notion・BaseMe・SmartES・リクナビ",
  description:
    "CareoとNotion・BaseMe・SmartES・リクナビの違いを徹底比較。AI自動分析・横断データ気づき・無料プランで始められるなど、Careoが選ばれる理由と他サービスとの共存モデルを解説。",
  alternates: {
    canonical: "https://careoai.jp/compare",
  },
  openGraph: {
    title: "就活管理アプリ比較 | Careo",
    description: "CareoとNotion・BaseMe・SmartESを徹底比較。AIが就活全体を管理・分析する新しいスタイルとは。",
    url: "https://careoai.jp/compare",
    siteName: "Careo",
    type: "website",
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
