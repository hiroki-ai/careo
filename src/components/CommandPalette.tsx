"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { COMPANY_STATUS_LABELS } from "@/types";

const NAV_ITEMS = [
  { label: "ダッシュボード", href: "/", icon: "🏠", keywords: "home ホーム" },
  { label: "カレオコーチ", href: "/chat", icon: "💬", keywords: "chat チャット コーチ 相談" },
  { label: "PDCAレポート", href: "/report", icon: "📊", keywords: "pdca レポート 分析" },
  { label: "週次コーチ", href: "/weekly-coach", icon: "🏃", keywords: "weekly 週次" },
  { label: "企業管理", href: "/companies", icon: "🏢", keywords: "company 企業 会社" },
  { label: "ES管理", href: "/es", icon: "📄", keywords: "es エントリーシート" },
  { label: "面接ログ", href: "/interviews", icon: "👥", keywords: "interview 面接" },
  { label: "カレンダー", href: "/calendar", icon: "📅", keywords: "calendar 予定" },
  { label: "締切一覧", href: "/deadlines", icon: "⏰", keywords: "deadline 締切 期限" },
  { label: "説明会・インターン", href: "/events", icon: "🎯", keywords: "event 説明会 インターン" },
  { label: "OB/OG訪問", href: "/ob-visits", icon: "🤝", keywords: "ob og 訪問" },
  { label: "筆記試験", href: "/tests", icon: "📝", keywords: "test 筆記 spi" },
  { label: "みんなの就活", href: "/insights", icon: "🌐", keywords: "insights community コミュニティ" },
  { label: "設定", href: "/settings", icon: "⚙️", keywords: "settings 設定 プロフィール" },
];

const QUICK_ACTIONS = [
  { label: "企業を追加", href: "/companies?action=add", icon: "➕", keywords: "add 追加 新規" },
  { label: "ESを作成", href: "/es?action=add", icon: "✍️", keywords: "create 作成 新規" },
  { label: "面接を記録", href: "/interviews?action=add", icon: "🎙️", keywords: "record 記録 面接" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { companies } = useCompanies();
  const { esList } = useEs();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="コマンドパレット" description="ページ・企業・ESを検索">
      <Command className="rounded-xl border-0 shadow-2xl">
        <CommandInput placeholder="ページ・企業・アクションを検索..." />
        <CommandList className="max-h-[360px]">
          <CommandEmpty>見つかりませんでした</CommandEmpty>

          <CommandGroup heading="クイックアクション">
            {QUICK_ACTIONS.map((action) => (
              <CommandItem
                key={action.href + action.label}
                value={`${action.label} ${action.keywords}`}
                onSelect={() => handleSelect(action.href)}
                className="gap-3 px-3 py-2.5 cursor-pointer"
              >
                <span className="text-base w-6 text-center shrink-0">{action.icon}</span>
                <span className="font-medium text-sm">{action.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="ページ">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => handleSelect(item.href)}
                className="gap-3 px-3 py-2.5 cursor-pointer"
              >
                <span className="text-base w-6 text-center shrink-0">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
                <CommandShortcut className="text-xs text-gray-400">{item.href}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>

          {companies.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="企業">
                {companies.slice(0, 8).map((company) => (
                  <CommandItem
                    key={company.id}
                    value={`${company.name} ${company.industry ?? ""} ${COMPANY_STATUS_LABELS[company.status]}`}
                    onSelect={() => handleSelect(`/companies/${company.id}`)}
                    className="gap-3 px-3 py-2.5 cursor-pointer"
                  >
                    <span className="text-base w-6 text-center shrink-0">🏢</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{company.name}</span>
                      {company.industry && (
                        <span className="ml-2 text-xs text-gray-400">{company.industry}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                      {COMPANY_STATUS_LABELS[company.status]}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {esList.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="ES">
                {esList.slice(0, 5).map((es) => {
                  const companyName = companies.find((c) => c.id === es.companyId)?.name ?? "";
                  return (
                    <CommandItem
                      key={es.id}
                      value={`${companyName} ${es.title} ES`}
                      onSelect={() => handleSelect(`/es/${es.id}`)}
                      className="gap-3 px-3 py-2.5 cursor-pointer"
                    >
                      <span className="text-base w-6 text-center shrink-0">📄</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{companyName}</span>
                        <span className="ml-2 text-xs text-gray-400">{es.title}</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          es.status === "DRAFT"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {es.status === "DRAFT" ? "下書き" : "提出済"}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>

        <div className="border-t border-gray-100 px-3 py-2 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">↑↓</kbd>
              移動
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">↵</kbd>
              選択
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">esc</kbd>
              閉じる
            </span>
          </div>
        </div>
      </Command>
    </CommandDialog>
  );
}
