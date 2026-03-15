# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # 開発サーバー起動 (http://localhost:3000)
npm run build    # プロダクションビルド（型チェック込み）
npm run lint     # ESLint 実行
```

テストは未設定。`npm run build` でビルドエラーと型エラーを確認するのが主な検証手段。

## Tech Stack

- **Framework**: Next.js 16 App Router / TypeScript / Tailwind CSS v4
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **AI**: Anthropic Claude `claude-haiku-4-5-20251001`（全AI機能で統一）
- **Social**: Twitter API v2 (`twitter-api-v2` パッケージ）

## Architecture

### データフロー

```
Supabase (PostgreSQL + RLS)
  ↕ supabase/client.ts または server.ts
src/hooks/useXxx.ts    ← CRUD + React state。snake_case→camelCase変換もここ
src/app/**/page.tsx    ← hooks を呼び出してUIへ渡す
```

全エンティティのCRUDはカスタムhooksに集約。DBカラムはsnake_case、TS型はcamelCase。

### 主要テーブル

| テーブル | 用途 |
|---------|------|
| `user_profiles` | 自己分析データ（career_axis / gakuchika / self_pr / strengths / weaknesses） |
| `companies` | 企業管理（status: WISHLIST→OFFERED/REJECTED） |
| `es_entries` + `es_questions` | ES管理。設問はネストしたテーブルに格納 |
| `interviews` + `interview_questions` | 面接ログ |
| `ob_visits` | OB/OG訪問ログ |
| `aptitude_tests` | 筆記試験管理 |
| `action_items` | AIが提案する週次アクション |
| `chat_messages` | チャット履歴 |

**`ob_visits` と `aptitude_tests` は `supabase_migration.sql` で別途マイグレーションが必要**（未実行の場合 `/ob-visits` `/tests` がエラーになる）。

### AI APIルートの共通パターン

`src/app/api/ai/` 以下の全ルートは同じ構造に従う：

```typescript
// 1. レート制限チェック（20req/min/IP/endpoint）
const { allowed } = checkRateLimit(ip, "endpoint-name");

// 2. Claudeにリクエスト（ストリーミング or 非ストリーミング）
const message = await anthropic.messages.create({ model: "claude-haiku-4-5-20251001", ... });

// 3. JSON抽出（Claudeはmarkdownコードブロックで返すことがある）
const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);
```

チャットのみ `ReadableStream` でストリーミング。他は全てJSON応答。

### AI機能一覧

| ルート | 機能 | 入力の特徴 |
|-------|------|-----------|
| `/api/ai/chat` | ストリーミングチャット | profile + companies + ES + interviews + actionItems を全送信 |
| `/api/ai/company-research` | 企業研究 | 企業名 + profile の軸・志望業界 |
| `/api/ai/es-generate` | ES文章生成 | 設問 + 文字数制限 + 同ES内の他設問 + profile |
| `/api/ai/pdca` | PDCA分析（スコア付き） | 全選考データ + 直近チャット |
| `/api/ai/next-action` | 週次アクション提案 | 全選考データ + コミュニティ集計 |
| `/api/ai/career-suggest` | 自己分析下書き生成 | profile の基本情報のみ |
| `/api/ai/offer-prediction` | 内定獲得スコア予測 | 全選考データ |
| `/api/ai/offer-compare` | 内定比較 | OFFERED企業 + career_axis |

コミュニティ集計は `supabase.rpc("get_careo_aggregate_insights")` で取得（個人データは非公開）。

### 認証フロー

```
未ログイン → /login
ログイン済み + user_profiles未作成 → /onboarding
ログイン済み + profile作成済み → アプリ全体
```

`src/middleware.ts` が全ルートを監視。`/login` `/signup` `/forgot-password` `/reset-password` は認証スキップ。

### レイアウト

- **PC**: `src/components/layout/Sidebar.tsx`（`hidden md:flex`）
- **モバイル**: `src/components/layout/BottomNav.tsx`（`md:hidden`、fixed bottom）
- **Toastの位置**: `bottom-20 md:bottom-6`（モバイルのBottomNavと被らないよう上に配置）

### X（Twitter）自動投稿システム

```
src/lib/x/character.ts    ← 開発者設定 + 5つの投稿ピラー + ハッシュタグ戦略
src/lib/x/generatePost.ts ← 時間帯に応じたピラー選択 + Claude で生成
src/lib/x/postToX.ts      ← Twitter API v2 で投稿
src/app/api/cron/x-post/  ← Vercel Cron（8時/12時/21時 JST）
src/app/api/x/preview/    ← GET=プレビューのみ、POST?post=1=実際に投稿
```

投稿ピラーを変更・追加する場合は `character.ts` の `PILLAR_PROMPTS` と `PILLAR_WEIGHTS` を編集。

## 型定義

全インターフェースとEnum定数は `src/types/index.ts` に集約。新しいエンティティを追加する際はここに型を定義してから実装する。

`CompanyStatus` の遷移順序は `COMPANY_STATUS_ORDER` 配列で管理。ステータスのラベル・色は `COMPANY_STATUS_LABELS` / `COMPANY_STATUS_COLORS` を参照（直接文字列を書かない）。

## 新機能追加時の手順

1. `src/types/index.ts` に型を追加
2. Supabaseにテーブル作成（RLS必須）+ `supabase_migration.sql` に追記
3. `src/hooks/useXxx.ts` を作成（snake_case→camelCase変換含む）
4. ページ・コンポーネントを実装
5. 必要に応じて `Sidebar.tsx` と `BottomNav.tsx` にナビゲーションを追加

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET  # X投稿機能
CRON_SECRET                                                    # Vercel Cron認証
```
