# Careo Chrome拡張機能 - 就活企業クイック追加

マイナビ・リクナビ等の就活サイトを閲覧しながら、ワンクリックで [Careo](https://careoai.jp) に企業情報を追加できるChrome拡張機能です。

## 機能概要

- 対応就活サイト上で企業名を自動検出してフォームに入力
- 業界・メモ・追加先ステータスを設定して企業を追加
- 就活サイト以外でも手動入力で追加可能
- Careoアカウントとの自動連携（JWT認証）

## 対応サイト

| サービス | URL |
|---------|-----|
| マイナビ就職 | https://job.mynavi.jp/ |
| リクナビ | https://job.rikunabi.com/ |
| ワンキャリア | https://www.onecareer.jp/ |
| Wantedly | https://www.wantedly.com/ |
| OfferBox | https://offerbox.jp/ |

## インストール方法（デベロッパーモード）

1. Google Chromeを開き、アドレスバーに `chrome://extensions/` と入力してEnter
2. 右上の「デベロッパーモード」トグルをONにする
3. 「パッケージ化されていない拡張機能を読み込む」ボタンをクリック
4. このファイルが入っているフォルダ（`extension/`）を選択
5. 拡張機能一覧に「Careo - 就活企業クイック追加」が表示されれば完了

### アイコンの準備

`icons/` フォルダに以下のサイズのPNG画像を用意してください（必須）:

- `icon16.png` (16×16px)
- `icon48.png` (48×48px)
- `icon128.png` (128×128px)

アイコンがない状態でも拡張機能は動作しますが、Chromeが警告を表示することがあります。

## ログイン連携方法

Careoにログイン済みの状態で拡張機能のポップアップを開くと、Careoのページから自動的にトークンが連携されます。

手動で連携する場合は、Careoにログインした状態でブラウザのコンソールから以下を実行してください（拡張機能IDは `chrome://extensions/` で確認）:

```javascript
chrome.runtime.sendMessage('YOUR_EXTENSION_ID', {
  action: 'setToken',
  token: 'YOUR_SUPABASE_ACCESS_TOKEN'
});
```

## ファイル構成

```
extension/
  manifest.json    - 拡張機能の設定（Manifest V3）
  popup.html       - ポップアップのHTML
  popup.css        - ポップアップのスタイル
  popup.js         - ポップアップのロジック
  content.js       - 各就活サイトの企業情報抽出スクリプト
  background.js    - Service Worker（ログイン連携）
  icons/
    icon16.png     - アイコン（要準備）
    icon48.png     - アイコン（要準備）
    icon128.png    - アイコン（要準備）
```

## Chrome Web Storeへの公開（TODO）

1. Googleデベロッパーアカウントを作成（$5の登録料が必要）
2. `chrome://extensions/` でパッケージを作成（ZIPファイル）
3. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/) にアクセス
4. 「新しいアイテム」から作成したZIPをアップロード
5. ストア掲載情報（説明・スクリーンショット・カテゴリ等）を入力
6. プライバシーポリシーURLを入力（careoai.jp のものを使用）
7. Googleのレビューを待つ（通常数日〜1週間）

## 開発メモ

- Manifest V3 準拠（Service Worker使用）
- 認証トークンは `chrome.storage.local` に保存（同期ストレージは使用しない）
- Careo API: `POST https://careoai.jp/api/extension/add-company`
- API認証: `Authorization: Bearer <supabase_jwt>`
