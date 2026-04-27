# Capacitor アプリストア提出ガイド

CareoをiOS/Androidアプリ化してApp Store / Google Play Storeに提出する手順。

## 構成方針

**hybrid型（WebView + ネイティブシェル）** を採用。
- 本体は `careoai.jp` を WebView で読み込み
- プッシュ通知・アプリ内課金などのネイティブ機能だけCapacitorプラグインで対応
- アプリ内のコード変更はWebデプロイで即時反映可能（再申請不要）

## 1. 依存パッケージ追加

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npm install @capacitor/splash-screen @capacitor/push-notifications @capacitor/status-bar
```

## 2. 初期化（一度だけ）

```bash
npx cap init Careo jp.careoai.app --web-dir=out
# capacitor.config.ts は既に commit 済み

npx cap add ios
npx cap add android
```

## 3. アイコン・スプラッシュ生成

```bash
# resources/icon.png (1024x1024) と resources/splash.png (2732x2732) を用意
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor "#fcfbf8" --splashBackgroundColor "#fcfbf8"
```

## 4. ネイティブビルド

```bash
npx cap sync
npx cap open ios       # Xcode で開いて Archive → App Store Connect
npx cap open android   # Android Studio で開いて Bundle → Google Play Console
```

## 5. ストア提出に必要な準備

### 共通
- [ ] アプリアイコン (1024x1024 PNG)
- [ ] スクリーンショット5枚以上（iPhone 6.5"・5.5"、Android）
- [ ] アプリ説明文（日本語、80文字 + 4000文字）
- [ ] プライバシーポリシー URL: `https://careoai.jp/privacy` (既存)
- [ ] サポートURL: `https://careoai.jp/contact` または twitter

### iOS（Apple Developer Program $99/年）
- [ ] Apple Developer Account
- [ ] App Store Connect で新規アプリ登録（Bundle ID: `jp.careoai.app`）
- [ ] App Privacy 申告（収集データ：メール・選考データ）
- [ ] テスト機能の確認（TestFlight）

### Android（Google Play Developer $25 一回払い）
- [ ] Google Play Console アカウント
- [ ] Internal Testing → Closed Testing → Production の段階
- [ ] Data Safety 申告

## 6. プッシュ通知設定

**iOS**: Apple Developer Portal で APNs キー作成 → Capacitor PushNotifications プラグインで自動配信
**Android**: Firebase プロジェクト作成 → `google-services.json` を `android/app/` に配置

既存の `usePushNotifications.ts` がWeb Pushを使っているが、ネイティブはCapacitor版に切り替える必要がある（次セッションで対応）。

## 7. 既知の制約

- Server-side rendering 部分は WebView でも問題なく動く（hybrid構成のため）
- Stripe決済はApple/Googleの規約で「アプリ内課金（IAP）」を使う必要がある可能性
  → CareoはサブスクなのでIAP対応が必須。`@revenuecat/purchases-capacitor` の検討
- ファイルダウンロード・カメラ起動などの機能を増やす際は対応プラグイン追加

## 8. リリース計画案

| Phase | 内容 | 期間目安 |
|-------|------|---------|
| α | 内部TestFlight / Internal Testing | 1〜2週間 |
| β | 外部TestFlight / Closed Testing（先輩・友人20名） | 2週間 |
| GA | App Store / Google Play 公開 | リリース日確定 |

申請費用（Apple $99/年、Google $25一回）は早期登録ユーザーが安定したタイミングで支払うのがベスト。
