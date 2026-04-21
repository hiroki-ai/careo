import type { Metadata, Viewport } from "next";
import { Geist, Yomogi, Shippori_Mincho } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PwaInstallBanner } from "@/components/layout/PwaInstallBanner";
import { ActivityTracker } from "@/components/layout/ActivityTracker";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeProvider } from "@/components/ThemeProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const yomogi = Yomogi({ weight: "400", subsets: ["latin"], variable: "--font-yomogi" });
const shipporiMincho = Shippori_Mincho({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-shippori-mincho", display: "swap" });

const APP_URL = "https://careoai.jp";

export const metadata: Metadata = {
  title: "Careo（カレオ）| AIで就活を管理するアプリ",
  description: "AI就活コーチ「カレオ」が選考・ES・面接・OB訪問を全部把握。就活のPDCAを自動で回すAI就活アプリ。無料・登録5分。",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32.png",
  },
  verification: {
    google: "2kjrzj66CrgHoAlDoUYL7CzhahsRlfXmZSyK7v2QBVc",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Careo",
  },
  keywords: ["就活管理", "AI就活", "就活アプリ", "ES管理", "面接管理", "就活PDCA", "就活ツール", "就活コーチ", "AIコーチ", "就活サポート", "Careo", "カレオ", "27卒", "28卒", "29卒", "30卒"],
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "Careo",
    title: "Careo（カレオ）| AIで就活を管理するアプリ",
    description: "AI就活コーチ「カレオ」が選考・ES・面接・OB訪問を全部把握。就活のPDCAを自動で回すAI就活アプリ。無料・登録5分。",
    locale: "ja_JP",
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Careo（カレオ）| AIで就活を管理するアプリ",
    description: "AI就活コーチ「カレオ」が選考・ES・面接・OB訪問を全部把握。就活のPDCAを自動で回すAI就活アプリ。無料・登録5分。",
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  alternates: {
    canonical: APP_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      "url": APP_URL,
      "name": "Careo（カレオ）",
      "description": "AI就活コーチアプリ。選考・ES・面接・OB訪問を一元管理。",
      "inLanguage": "ja",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${APP_URL}/companies?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ItemList",
      "name": "Careo メインメニュー",
      "itemListElement": [
        {
          "@type": "SiteLinksSearchBox",
          "url": APP_URL,
        },
        {
          "@type": "ListItem",
          "position": 1,
          "name": "学生ログイン",
          "url": `${APP_URL}/login`,
          "description": "就活管理アプリCareoに学生としてログイン",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "新規登録（無料）",
          "url": `${APP_URL}/signup`,
          "description": "Careoに無料で新規登録する",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "キャリアセンター担当者ログイン",
          "url": `${APP_URL}/login?next=/career-portal`,
          "description": "大学キャリアセンター担当者向けポータルにログイン",
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "大学キャリアセンター向けサービス",
          "url": `${APP_URL}/for-career-center`,
          "description": "大学キャリアセンターとの提携・連携について",
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geist.variable} ${yomogi.variable} ${shipporiMincho.variable} font-sans antialiased bg-gray-50 dark:bg-[#0f1117]`}>
        <ThemeProvider>
          <ToastProvider>
            <ActivityTracker />
            <PwaInstallBanner />
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 flex flex-col pb-16 md:pb-0 min-w-0">
                {children}
              </main>
            </div>
            <BottomNav />
            <CommandPalette />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
