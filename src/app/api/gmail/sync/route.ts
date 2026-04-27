import { NextRequest, NextResponse } from "next/server";

/**
 * Gmail同期APIの骨組み（次セッションで完成予定）
 *
 * TODO:
 * 1. /api/auth/google/callback でOAuth → gmail_credentials に保存
 * 2. このルートでトークンをロード → アクセストークンが期限切れなら refresh
 * 3. Gmail API (users.messages.list) で受信トレイから1ヶ月分取得
 * 4. 各メッセージのfrom_domainを抽出し、company_domain_hints / companies.url から企業マッチング
 * 5. マッチした企業ごとに email_threads にupsert
 * 6. 必要に応じて /api/ai/email-action へ流して次アクション提案を生成
 *
 * 環境変数（追加予定）:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI
 */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      status: "not_implemented",
      message: "Gmail連携は近日公開予定です。設定 → Gmail連携から早期通知に登録できます。",
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json({
    status: "coming_soon",
    features_planned: [
      "受信メールを企業ごとに自動仕分け",
      "件名・本文からの次アクション提案（返信／添付提出／日程調整など）",
      "面接・OB訪問のメール自動検出",
      "「対応漏れ」の検知通知",
    ],
  });
}
