"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { InterviewForm } from "@/components/interviews/InterviewForm";

function NewInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId") ?? "";
  const { addInterview } = useInterviews();
  const { companies } = useCompanies();

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/interviews" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
        ← 面接一覧
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">面接を追加</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <InterviewForm
          companies={companies}
          initialCompanyId={companyId}
          onSubmit={(data) => {
            const interview = addInterview(data);
            router.push(`/interviews/${interview.id}`);
          }}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

export default function NewInterviewPage() {
  return (
    <Suspense fallback={<div className="p-8">読み込み中...</div>}>
      <NewInterviewContent />
    </Suspense>
  );
}
