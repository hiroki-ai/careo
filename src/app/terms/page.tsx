import Link from "next/link";

export const metadata = { title: "利用規約 | Careo" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-8">
          <img src="/icon-new.svg" alt="Careo" className="w-7 h-7 rounded-xl" />
          <span className="font-bold text-lg text-[#0D0B21]">Careo</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">利用規約</h1>
        <p className="text-xs text-gray-400 mb-8">最終更新日：2026年3月23日</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-bold text-gray-900 mb-2">第1条（はじめに）</h2>
            <p>
              本利用規約（以下「本規約」）は、Careo（以下「当サービス」）の利用条件を定めるものです。
              当サービスをご利用いただく場合、本規約に同意いただいたものとみなします。
              当サービスは、就活生が企業情報・ES・面接・OB訪問・筆記試験を一元管理し、
              AIコーチング機能を利用できる就活管理アプリです。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第2条（アカウント）</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>登録はメールアドレスとパスワードのみで完了します</li>
              <li>アカウント情報は正確に入力してください</li>
              <li>パスワードの管理はご自身の責任で行ってください</li>
              <li>1人1アカウントのご利用をお願いします</li>
              <li>アカウント設定からいつでもアカウントを削除できます</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第3条（利用対象）</h2>
            <p>
              当サービスは大学生・大学院生を主な対象としていますが、
              その他の方もご利用いただけます。
              未成年の方は保護者の同意のうえでご利用ください。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第4条（禁止事項）</h2>
            <p>以下の行為を禁止します。</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>不正アクセス、または当サービスへの攻撃行為</li>
              <li>他のユーザーのアカウントを利用する行為</li>
              <li>虚偽の情報の登録</li>
              <li>当サービスを商業目的で第三者に利用させる行為</li>
              <li>AIコーチング機能を悪用する行為</li>
              <li>その他、当サービスの運営を妨害する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第5条（AIの利用について）</h2>
            <p>
              当サービスが提供するAI機能（カレオコーチ、PDCA分析、ES提出前チェック等）は
              情報提供を目的としており、内定・選考通過を保証するものではありません。
              AIの回答はあくまでも参考情報としてご活用ください。
              AIの生成内容についての正確性・完全性を当サービスは保証しません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第6条（データの取り扱い）</h2>
            <p>
              ご登録いただいたデータ（企業情報・ES・面接記録等）は
              サービス提供のために利用します。
              詳細は<Link href="/privacy" className="text-[#00c896] hover:underline">プライバシーポリシー</Link>をご確認ください。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第7条（免責事項）</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>当サービスは就活の成功・内定を保証しません</li>
              <li>サービスの中断・停止による損害について責任を負いません</li>
              <li>ユーザーが入力したデータの損失について責任を負いません</li>
              <li>当サービスを通じて得た情報の正確性を保証しません</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第8条（サービスの変更・終了）</h2>
            <p>
              当サービスは予告なく機能の変更・追加・削除を行う場合があります。
              また、やむを得ない事情によりサービスを終了する場合があります。
              その際はできる限り事前にお知らせします。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第9条（準拠法）</h2>
            <p>本規約は日本法に準拠し、解釈されます。</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-900 mb-2">第10条（お問い合わせ）</h2>
            <p>
              本規約に関するご質問は、当サービス内のフィードバック機能よりお問い合わせください。
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4 text-sm">
          <Link href="/privacy" className="text-[#00c896] hover:underline">プライバシーポリシー</Link>
          <Link href="/signup" className="text-gray-400 hover:text-gray-600">← 新規登録に戻る</Link>
        </div>
      </div>
    </div>
  );
}
