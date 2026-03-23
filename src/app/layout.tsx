import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PwaInstallBanner } from "@/components/layout/PwaInstallBanner";
import { ToastProvider } from "@/components/ui/Toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

const APP_URL = "https://careoai.jp";

export const metadata: Metadata = {
  title: "Careo（カレオ）| AIで就活を管理する28卒向けアプリ",
  description: "AI就活コーチ「カレオ」が選考・ES・面接・OB訪問を全部把握。就活のPDCAを自動で回す28卒向けアプリ。無料・登録5分。",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon-new.svg", type: "image/svg+xml" }],
    apple: "/icon-new.svg",
  },
  verification: {
    google: "2kjrzj66CrgHoAlDoUYL7CzhahsRlfXmZSyK7v2QBVc",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Careo",
  },
  keywords: ["就活管理", "AI就活", "28卒", "就活アプリ", "ES管理", "面接管理", "就活PDCA", "就活ツール", "就活コーチ", "AIコーチ", "就活サポート", "Careo", "カレオ"],
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "Careo",
    title: "Careo（カレオ）| AIで就活を管理する28卒向けアプリ",
    description: "AI就活コーチ「カレオ」が選考・ES・面接・OB訪問を全部把握。就活のPDCAを自動で回す28卒向けアプリ。無料・登録5分。",
    locale: "ja_JP",
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Careo（カレオ）| AIで就活を管理する28卒向けアプリ",
    description: "AI就活コーチ「カレオ」が選考・ES・面接・OB訪問を全部把握。就活のPDCAを自動で回す28卒向けアプリ。無料・登録5分。",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geist.variable} font-sans antialiased bg-gray-50`}>
        <ToastProvider>
          <PwaInstallBanner />
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 flex flex-col pb-16 md:pb-0 min-w-0">
              {children}
            </main>
          </div>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
