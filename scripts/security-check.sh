#!/usr/bin/env bash
# ================================================================
# Careo セキュリティチェックスクリプト
# 定期実行推奨: 月1回 または npm install 後
# 使い方: bash scripts/security-check.sh
# ================================================================

set -euo pipefail
PASS=0
WARN=0
FAIL=0

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC}   $1"; PASS=$((PASS+1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; WARN=$((WARN+1)); }
fail() { echo -e "${RED}[FAIL]${NC} $1"; FAIL=$((FAIL+1)); }

echo "========================================"
echo " Careo セキュリティチェック"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# ----------------------------------------------------------------
# 1. npm audit（既知の脆弱性チェック）
# ----------------------------------------------------------------
echo ""
echo "--- 1. npm audit ---"
AUDIT_OUTPUT=$(npm audit --audit-level=high 2>&1 || true)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
  ok "既知の脆弱性なし"
elif echo "$AUDIT_OUTPUT" | grep -qE "critical|high"; then
  fail "高/Critical レベルの脆弱性が検出されました。npm audit fix を実行してください"
  echo "$AUDIT_OUTPUT" | grep -E "critical|high" | head -10
else
  warn "低/中レベルの脆弱性があります（npm audit で詳細確認）"
fi

# ----------------------------------------------------------------
# 2. 環境変数ファイルが Git に含まれていないか
# ----------------------------------------------------------------
echo ""
echo "--- 2. 機密ファイルの Git 追跡チェック ---"
if [ -f ".gitignore" ]; then
  for secret_file in ".env" ".env.local" ".env.production"; do
    if git ls-files --error-unmatch "$secret_file" 2>/dev/null; then
      fail "$secret_file が Git 管理下に入っています！即座に削除してください"
    else
      ok "$secret_file は Git 管理外"
    fi
  done
else
  warn ".gitignore が見つかりません"
fi

# ----------------------------------------------------------------
# 3. 環境変数キーが .env.local に存在するか（ローカル開発環境）
# ----------------------------------------------------------------
echo ""
echo "--- 3. 必須環境変数チェック（.env.local） ---"
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "ANTHROPIC_API_KEY"
  "CRON_SECRET"
)
if [ -f ".env.local" ]; then
  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env.local; then
      ok "$var 設定済み"
    else
      warn "$var が .env.local に未設定"
    fi
  done
else
  warn ".env.local が存在しません（Vercel 環境変数で管理している場合は問題なし）"
fi

# ----------------------------------------------------------------
# 4. セキュリティヘッダーが next.config.ts に設定されているか
# ----------------------------------------------------------------
echo ""
echo "--- 4. セキュリティヘッダーチェック ---"
REQUIRED_HEADERS=(
  "X-Content-Type-Options"
  "X-Frame-Options"
  "Referrer-Policy"
  "Permissions-Policy"
)
for header in "${REQUIRED_HEADERS[@]}"; do
  if grep -q "$header" next.config.ts 2>/dev/null; then
    ok "$header 設定済み"
  else
    fail "$header が next.config.ts に未設定"
  fi
done

# ----------------------------------------------------------------
# 5. SERVICE_ROLE_KEY がクライアントコードに漏れていないか
# ----------------------------------------------------------------
echo ""
echo "--- 5. SERVICE_ROLE_KEY の露出チェック ---"
LEAK=$(grep -r "SUPABASE_SERVICE_ROLE_KEY" src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | \
       grep -v "route.ts" || true)
if [ -z "$LEAK" ]; then
  ok "SERVICE_ROLE_KEY はサーバーサイド（route.ts）のみで使用"
else
  fail "SERVICE_ROLE_KEY がクライアント可能なファイルで参照されています:"
  echo "$LEAK"
fi

# ----------------------------------------------------------------
# 6. NEXT_PUBLIC_ 変数に機密情報が混入していないか
# ----------------------------------------------------------------
echo ""
echo "--- 6. NEXT_PUBLIC_ 変数の安全性チェック ---"
DANGEROUS_PUBLIC=$(grep -r "NEXT_PUBLIC_" src/ --include="*.ts" --include="*.tsx" -h 2>/dev/null | \
                   grep -oE "NEXT_PUBLIC_[A-Z_]+" | sort -u | \
                   grep -vE "NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|NEXT_PUBLIC_SENTRY_DSN|NEXT_PUBLIC_ADMIN_EMAIL" || true)
if [ -z "$DANGEROUS_PUBLIC" ]; then
  ok "NEXT_PUBLIC_ 変数に想定外の機密情報なし"
else
  warn "以下の NEXT_PUBLIC_ 変数を確認してください（機密情報を含まないか）:"
  echo "$DANGEROUS_PUBLIC"
fi

# ----------------------------------------------------------------
# 7. package.json の依存パッケージバージョン確認
# ----------------------------------------------------------------
echo ""
echo "--- 7. 主要パッケージの最新バージョン確認 ---"
OUTDATED=$(npm outdated --depth=0 2>/dev/null | grep -v "Package\|MISSING" || true)
if [ -z "$OUTDATED" ]; then
  ok "主要パッケージは最新（または最新確認済み）"
else
  warn "以下のパッケージに更新があります（セキュリティ関連を優先してください）:"
  echo "$OUTDATED" | head -20
fi

# ----------------------------------------------------------------
# 結果サマリー
# ----------------------------------------------------------------
echo ""
echo "========================================"
echo " 結果サマリー"
echo "========================================"
echo -e "${GREEN}OK${NC}:   $PASS 項目"
echo -e "${YELLOW}WARN${NC}: $WARN 項目"
echo -e "${RED}FAIL${NC}: $FAIL 項目"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}FAIL が $FAIL 件あります。優先的に対応してください。${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo -e "${YELLOW}WARN が $WARN 件あります。確認を推奨します。${NC}"
  exit 0
else
  echo -e "${GREEN}すべてのチェックをパスしました。${NC}"
  exit 0
fi
