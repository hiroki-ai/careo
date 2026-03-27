# Careo 個人情報取り扱いフロー（内部資料）

最終更新日：2026年3月27日

---

## 1. 収集する個人情報と収集箇所

| データ種別 | 収集タイミング | 保存先テーブル |
|---|---|---|
| メールアドレス | 会員登録 | `auth.users`（Supabase Auth管理） |
| 氏名・大学・学部・学年・卒業年 | オンボーディング Step 1 | `user_profiles` |
| 就活軸・自己PR・強み・弱み・学チカ | オンボーディング Step 1 / 設定 | `user_profiles` |
| 志望企業・選考フェーズ | 企業登録・更新 | `companies` |
| ESの設問・回答 | ES管理機能 | `es_entries`, `es_questions` |
| 面接記録 | 面接ログ機能 | `interviews`, `interview_questions` |
| OB/OG訪問記録 | OB訪問機能 | `ob_visits` |
| 筆記試験スコア | テスト管理機能 | `aptitude_tests` |
| AIチャット履歴 | AIコーチ機能 | `chat_messages` |
| AIが生成した自己分析 | AIコーチ機能 | `user_profiles.ai_self_analysis` |
| 自己分析変更履歴 | 設定変更時 | `self_analysis_history` |
| プッシュ通知トークン | 通知設定 | `push_subscriptions` |
| お問い合わせ内容 | キャリアセンター向けフォーム | `career_center_inquiries` |

---

## 2. データフロー図

```
[ユーザー（学生）]
  │
  ├─ Supabase Auth（メール・パスワード） ─ RLS付きで全テーブルを保護
  │
  ├─ Supabaseデータベース（個人データ）
  │    └─ Row Level Security: 本人 + 同一大学のキャリアセンタースタッフのみ参照可
  │
  ├─ Anthropic Claude API（AI機能）
  │    └─ 送信するデータ: プロフィール概要 + 企業名 + 選考フェーズ
  │    └─ 送信しないデータ: 学籍番号・ES全文（PDCAなど軽量API利用時）
  │
  ├─ Vercel（ホスティング）
  │    └─ アクセスログ（Vercel管理、個別取得不可）
  │
  └─ Sentry（エラー監視）
       └─ スタックトレースのみ。PII除外設定を確認すること
```

---

## 3. キャリアセンターへのデータ提供フロー

```
[学生] ──（利用規約同意）──→ データ公開（デフォルト: 全項目）
                                │
                                ├─ 設定ページで項目ごとに「非公開」設定可能
                                │    career_center_visibility JSONB で管理
                                │
                                └─ [キャリアセンタースタッフ]
                                      │
                                      ├─ 同一大学の学生データのみ閲覧可（RLS）
                                      ├─ 非公開項目はAPIで除外（アプリ層制御）
                                      ├─ 閲覧ログを自動記録（career_center_access_logs）
                                      └─ 「公開リクエスト」送信可（強制開示は不可）
```

### 3-1. キャリアセンターに提供されるデータ項目

| 項目 | visibility キー | デフォルト |
|---|---|---|
| 志望業界・職種 | `targetIndustriesJobs` | 公開 |
| 志望企業・選考状況 | `companies` | 公開 |
| ES・自己分析 | `esSelfAnalysis` | 公開 |
| OB/OG訪問記録 | `obVisits` | 公開 |
| 筆記試験スコア | `aptitudeTests` | 公開 |
| 内定状況 | `offerStatus` | 公開 |

### 3-2. スタッフへのデータ提供制限

- スタッフは**同一大学**の学生データのみ参照可（`university` カラムで RLS 制御）
- スタッフによる第三者提供・マーケティング利用は利用規約で禁止
- 全アクセスは `career_center_access_logs` に記録される

---

## 4. データ削除フロー

### 退会時（ユーザー申請）

1. ユーザーが設定ページ「アカウント削除」を実行
2. `/api/account/delete` でパスワード再確認
3. Supabase Auth からユーザーを削除
4. CASCADE 設定により以下が自動削除:
   - `user_profiles`, `companies`, `es_entries`, `es_questions`
   - `interviews`, `interview_questions`, `ob_visits`, `aptitude_tests`
   - `chat_messages`, `action_items`, `self_analysis_history`
   - `push_subscriptions`

### 個人情報開示・訂正・利用停止請求（ユーザー申請）

1. アプリ内フィードバック機能から申請受付
2. 本人確認（メールアドレス + 必要に応じて証明書）
3. 対応期限: 受付後2週間以内
4. 対応内容: 開示（CSVエクスポート）/ 訂正（手動更新）/ 削除（退会フロー）

---

## 5. 第三者サービスとのデータ共有

| サービス | 共有データ | 目的 | DPA / 契約 |
|---|---|---|---|
| Supabase | 全個人データ | DB・認証 | Supabase利用規約・DPA適用 |
| Anthropic Claude | プロフィール概要・企業データ（匿名化） | AI機能 | Anthropic利用規約適用 |
| Vercel | アクセスログ（IP等） | ホスティング | Vercel利用規約適用 |
| Sentry | エラーログ（スタックトレース） | 障害監視 | Sentry利用規約適用 |
| Resend | メールアドレス | 通知メール送信 | Resend利用規約適用 |

**注意**: PII（氏名・学籍番号等）はAnthropicへの送信対象外とすること。

---

## 6. セキュリティ管理体制

### 現在の対策

- **Row Level Security (RLS)**: 全ユーザーデータテーブルに適用済み
- **HTTPS**: Vercel によりすべての通信を暗号化
- **セキュリティヘッダー**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **パスワード管理**: Supabase Auth（bcrypt ハッシュ化）
- **レート制限**: AI APIエンドポイントに 20req/min/IP の制限
- **エラー監視**: Sentry でスタックトレースを記録
- **Cronシークレット**: Vercel Cron は `CRON_SECRET` で認証
- **サービスロールキー**: サーバーサイド専用（`SUPABASE_SERVICE_ROLE_KEY` はクライアントに露出しない）
- **関数のsearch_path固定**: SQLインジェクション対策（`SET search_path = ''`）

### 既知のギャップと対応方針

| ギャップ | リスク | 対応方針 |
|---|---|---|
| career_center_visibility の RLS 未対応 | DBに直接接続した場合、スタッフが非公開項目を参照できる可能性 | アプリ層APIで制御中。キャリアセンターポータル拡大時にDB層RLSポリシーに移行を検討 |
| Sentry へのPII混入 | エラーログにユーザーデータが含まれる可能性 | Sentryの`beforeSend`フックでPIIフィルタリングを実装することを推奨 |
| 依存パッケージ脆弱性 | 既知の脆弱性を持つパッケージの混入 | `npm audit` を定期実行（scripts/security-check.sh 参照） |

---

## 7. インシデント対応フロー

1. **検知**: Sentryアラート / ユーザー報告
2. **初動（24時間以内）**: 影響範囲の特定、必要に応じてサービス停止
3. **通知**: 漏洩が疑われる場合、影響ユーザーにアプリ内通知 + メール
4. **報告**: 個人情報保護委員会への報告（3000件超または要配慮個人情報の場合は義務）
5. **記録**: インシデント記録を `docs/security/incidents/` に保存

---

*このドキュメントは社内向け運用資料です。外部公開しないこと。*
