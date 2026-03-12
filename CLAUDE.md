# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # 開発サーバー起動 (http://localhost:3000)
npm run build    # プロダクションビルド
npm run lint     # ESLint実行
```

## Architecture

**Tech stack**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4

**Data persistence**: localStorage のみ（サーバー・DBなし）。初回アクセス時にダミーデータが自動投入される。

### Data flow

```
src/data/dummy.ts       ← 初期ダミーデータ
src/lib/storage.ts      ← localStorage read/write（getXxx / saveXxx）
src/hooks/useXxx.ts     ← CRUD操作 + React state管理（useCompanies / useEs / useInterviews）
src/app/**/page.tsx     ← hooks を呼び出してUIに渡す
```

### Key design decisions

- **型定義は `src/types/index.ts` に集約**。`Company`, `ES`, `Interview` の3エンティティ。リレーションはIDで持つ（`companyId`）。
- **hooks はlocalStorage と React state を同期**。`useEffect` で初期ロード、更新時は state と localStorage を同時更新。
- **AIアドバイスはルールベース** (`src/lib/ai.ts`)。締切の近さ・未記入設問・ステータス停滞などを条件判定して `Advice[]` を返す。Claude API 連携は未実装。
- **共通UIコンポーネント** は `src/components/ui/` に配置（`Button`, `Badge`, `StatusBadge`, `Modal`）。

### Entity relationships

- `Company` が中心。`ES` と `Interview` は `companyId` で紐付く。
- `CompanyStatus` は `WISHLIST → APPLIED → DOCUMENT → INTERVIEW_1 → INTERVIEW_2 → FINAL → OFFERED / REJECTED` の順序で定義（`COMPANY_STATUS_ORDER` 配列）。
- 企業詳細ページ (`/companies/[id]`) でステータスをクリックして変更可能。

### Adding new features

新しいエンティティを追加する場合:
1. `src/types/index.ts` に型を追加
2. `src/data/dummy.ts` にダミーデータを追加
3. `src/lib/storage.ts` に get/save 関数を追加
4. `src/hooks/useXxx.ts` を作成
5. `src/app/` にページ、`src/components/` にフォームを作成
