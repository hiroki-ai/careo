"use client";

import { Suspense, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { EsForm } from "@/components/es/EsForm";

function NewEsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId") ?? "";
  const { addEs } = useEs();
  const { companies } = useCompanies();

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/es" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
        ← ES一覧
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ESを追加</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <EsForm
          companies={companies}
          initialCompanyId={companyId}
          onSubmit={async (data) => {
            const es = await addEs(data);
            router.push(`/es/${es.id}`);
          }}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

export default function NewEsPage() {
  return (
    <Suspense fallback={<div className="p-8">読み込み中...</div>}>
      <NewEsContent />
    </Suspense>
  );
}
