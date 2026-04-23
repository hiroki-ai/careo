import Script from "next/script";

/**
 * AdSense のメインスクリプトをheadに差し込む。
 * 環境変数 NEXT_PUBLIC_ADSENSE_CLIENT_ID が設定されている時のみロード。
 * layout.tsx に1つだけ配置する想定。
 */
export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (!clientId) return null;
  return (
    <Script
      id="adsense-main"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    />
  );
}
