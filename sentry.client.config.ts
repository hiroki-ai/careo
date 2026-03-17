import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // 本番環境のみ有効
  enabled: process.env.NODE_ENV === "production",
  ignoreErrors: [
    // ユーザー操作によるキャンセルは無視
    "AbortError",
  ],
});
