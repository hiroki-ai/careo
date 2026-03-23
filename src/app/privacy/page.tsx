import Link from "next/link";

export const metadata = { title: "プライバシーポリシー | Careo" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-8">
          <img src="/icon-new.svg" alt="Careo" className="w-7 h-7 rounded-xl" />
          <span className="font-bold text-lg text-[#0D0B21]">Careo</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
        <p className="text-xs text-gray-400 mb-8">最終更新日：2026年3月23日</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-gray-900 mb-2">1. 収集する情報</h2>
            <p className="mb-2">当サービスでは以下の情報を収集・保存します。</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>アカウント情報：</strong>メールアドレス、パスワード（ハッシュ化して保存）</li>
              <li><strong>プロフィール情報：</strong>大学名、学部、学年、志望業界など（任意）</li>
              <li><strong>就活データ：</strong>登録した企業情報・ES・面接記録・OB訪問・筆記試験</li>
              <li><strong>AIとの会話履歴：</strong>カレオコーチとのチャット内容</li>
              <li><strong>利用状況：</strong>最終チャット日時など（LocalStorageに保存）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">2. 利用目的</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>就活管理機能の提供（企業管理・ES管理・面接記録等）</li>
              <li>AIコーチング機能の提供（PDCA分析・気づき通知・ES提出前チェック等）</li>
              <li>サービスの改善・開発</li>
              <li>不正アクセスの防止</li>
            </ul>
            <p className="mt-2 text-gray-500">
              収集した情報を第三者への販売・マーケティング目的で利用することはありません。
              広告メールやスカウト電話は一切送付しません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">3. 第三者への提供・利用するサービス</h2>
            <p className="mb-3">サービス提供のため、以下の外部サービスを利用しています。</p>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">Supabase（データベース）</p>
                <p className="text-gray-600 text-xs">
                  就活データ・アカウント情報の保存に使用。行レベルセキュリティ（RLS）により、
                  ご自身のデータには自分だけがアクセスできます。
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">Anthropic Claude（AI）</p>
                <p className="text-gray-600 text-xs">
                  AIコーチング・PDCA分析・企業研究等に使用。
                  就活データの一部をAI処理のためAnthropicのAPIに送信します。
                  Anthropicのプライバシーポリシーが適用されます。
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">Vercel（ホスティング）</p>
                <p className="text-gray-600 text-xs">
                  サービスの提供インフラとして使用。アクセスログが記録される場合があります。
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              法令に基づく要請がある場合を除き、上記以外の第三者に個人情報を提供しません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">4. セキュリティ</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>データはSupabaseのPostgreSQLデータベースに保存され、行レベルセキュリティ（RLS）で保護</li>
              <li>通信はSSL/TLS暗号化</li>
              <li>パスワードはハッシュ化して保存（平文では保存しません）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">5. Cookieおよびローカルストレージ</h2>
            <p>
              当サービスはセッション管理にCookieを使用します。
              また、最終チャット日時などの設定情報をブラウザのLocalStorageに保存します。
              追跡目的のCookieや広告Cookieは使用しません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">6. データの保管期間・削除</h2>
            <p>
              アカウントを削除すると、登録したすべてのデータ（プロフィール・企業情報・ES・面接記録等）が削除されます。
              アカウント削除は設定ページから行えます。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">7. 未成年者のプライバシー</h2>
            <p>
              当サービスは13歳未満の方を対象としていません。
              13歳未満の方からの情報収集が判明した場合、速やかに削除します。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">8. ポリシーの変更</h2>
            <p>
              本ポリシーは予告なく変更される場合があります。
              重要な変更がある場合はサービス内でお知らせします。
              変更後も当サービスを継続してご利用いただいた場合、変更後のポリシーに同意いただいたものとみなします。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">9. お問い合わせ</h2>
            <p>
              個人情報の取り扱いに関するご質問・ご要望は、
              当サービス内のフィードバック機能よりお問い合わせください。
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4 text-sm">
          <Link href="/terms" className="text-[#00c896] hover:underline">利用規約</Link>
          <Link href="/signup" className="text-gray-400 hover:text-gray-600">← 新規登録に戻る</Link>
        </div>
      </div>
    </div>
  );
}
