"use client";

import { useState } from "react";
import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CompanyStatus, COMPANY_STATUS_LABELS, COMPANY_STATUS_ORDER } from "@/types";

export default function CompaniesPage() {
  const { companies, addCompany } = useCompanies();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | "ALL">("ALL");

  const filtered = filterStatus === "ALL"
    ? companies
    : companies.filter((c) => c.status === filterStatus);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">企業管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{companies.length}社を管理中</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ 企業を追加</Button>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            filterStatus === "ALL" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
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
                filterStatus === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              }`}
            >
              {COMPANY_STATUS_LABELS[s]} ({count})
            </button>
          );
        })}
      </div>

      {/* 企業一覧 */}
      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <p>企業が登録されていません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((company) => (
            <Link key={company.id} href={`/companies/${company.id}`}>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{company.name}</h3>
                  <StatusBadge status={company.status} className="ml-2 shrink-0" />
                </div>
                {company.industry && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{company.industry}</p>
                )}
                {company.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{company.notes}</p>
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
    </div>
  );
}
