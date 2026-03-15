import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Careo - 28卒の就活は、AIと始める。",
  description: "ES締切・面接日程・企業研究・反省メモをAIが整理。就活のPDCAを自動で回す、28卒向け就活管理アプリ。Notionやスプレッドシートより簡単に、AIが次の一手まで教えてくれる。",
  manifest: "/manifest.json",
  verification: {
    google: "2kjrzj66CrgHoAlDoUYL7CzhahsRlfXmZSyK7v2QBVc",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Careo",
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
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto flex flex-col pb-16 md:pb-0">
              {children}
            </main>
          </div>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
