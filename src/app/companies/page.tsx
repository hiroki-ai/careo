"use client";

import { useState } from "react";
import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { CompanyStatus, COMPANY_STATUS_LABELS, COMPANY_STATUS_ORDER } from "@/types";

export default function CompaniesPage() {
  const { companies, addCompany } = useCompanies();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const handleBulkImport = async () => {
    const lines = importText
      .split(/[\n,]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      showToast("企業名を入力してください", "warning");
      return;
    }

    setImporting(true);
    try {
      for (const name of lines) {
        await addCompany({ name, status: "WISHLIST", industry: "", notes: "" });
      }
      showToast(`${lines.length}社を追加しました`, "success");
      setImportText("");
      setIsImportOpen(false);
    } catch (err) {
      console.error("[bulkImport]", err);
      showToast("インポートに失敗しました", "error");
    } finally {
      setImporting(false);
    }
  };

  const filtered = companies
    .filter((c) => filterStatus === "ALL" || c.status === filterStatus)
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.industry ?? "").toLowerCase().includes(q);
    });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">企業管理</h1>
          <p className="text-sm text-gray-500 mt-1">{companies.length}社を管理中</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsImportOpen(true)}>一括インポート</Button>
          <Button onClick={() => setIsModalOpen(true)}>+ 企業を追加</Button>
        </div>
      </div>

      {/* 検索 */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="企業名・業界で検索..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* フィルター */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            filterStatus === "ALL" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          すべて ({companies.length})
        </button>
        {COMPANY_STATUS_ORDER.map((s) => {
          const count = companies.filter((c) => c.status === s).length;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                filterStatus === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {COMPANY_STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* 企業一覧 */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>企業が登録されていません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 leading-tight">{company.name}</h3>
                  <StatusBadge status={company.status} className="ml-2 shrink-0" />
                </div>
                {company.industry && (
                  <p className="text-sm text-gray-500 mb-2">{company.industry}</p>
                )}
                {company.notes && (
                  <p className="text-sm text-gray-600 line-clamp-2">{company.notes}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="企業を追加">
        <CompanyForm
          onSubmit={(data) => {
            addCompany(data);
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
          submitLabel="追加する"
        />
      </Modal>

      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="企業を一括インポート">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">企業名を1行または1社ずつ入力してください。</p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder={"企業名を1行に1社ずつ入力してください\n例:\nトヨタ自動車\nソニーグループ\n楽天グループ"}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 resize-none"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsImportOpen(false)} disabled={importing}>
              キャンセル
            </Button>
            <Button onClick={handleBulkImport} disabled={importing}>
              {importing ? "追加中..." : "追加する"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
