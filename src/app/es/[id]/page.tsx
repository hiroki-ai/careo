"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { EsForm } from "@/components/es/EsForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";

export default function EsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { esList, updateEs, deleteEs } = useEs();
  const { companies } = useCompanies();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);

  const es = esList.find((e) => e.id === id);
  const company = es ? companies.find((c) => c.id === es.companyId) : null;

  if (!es) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">ESが見つかりません</p>
        <Link href="/es" className="text-blue-600 text-sm mt-2 inline-block">← ES一覧に戻る</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/es" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">← ES一覧</Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          {company && (
            <Link href={`/companies/${company.id}`} className="text-sm text-blue-500 hover:underline mb-1 inline-block">
              {company.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{es.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={es.status === "SUBMITTED" ? "success" : "warning"}>
              {es.status === "SUBMITTED" ? "提出済み" : "下書き"}
            </Badge>
            {es.deadline && (
              <span className="text-sm text-gray-500">締切: {formatDate(es.deadline)}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>編集</Button>
          <Button variant="danger" size="sm" onClick={() => setIsDeleteConfirm(true)}>削除</Button>
        </div>
      </div>

      {/* 設問・回答 */}
      <div className="space-y-4">
        {es.questions.map((q, i) => (
          <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-6">
            <p className="text-xs text-gray-400 mb-1">設問 {i + 1}</p>
            <p className="font-medium text-gray-900 mb-3">{q.question || "(設問未入力)"}</p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {q.answer || "(回答未入力)"}
              </p>
            </div>
            {q.answer && (
              <p className="text-xs text-gray-400 mt-2 text-right">{q.answer.length}字</p>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="ESを編集" size="lg">
        <EsForm
          companies={companies}
          initialData={es}
          onSubmit={(data) => {
            updateEs(id, data);
            setIsEditOpen(false);
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      <Modal isOpen={isDeleteConfirm} onClose={() => setIsDeleteConfirm(false)} title="ESを削除" size="sm">
        <p className="text-sm text-gray-600 mb-6">「{es.title}」を削除しますか？</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteConfirm(false)}>キャンセル</Button>
          <Button variant="danger" onClick={() => { deleteEs(id); router.push("/es"); }}>削除する</Button>
        </div>
      </Modal>
    </div>
  );
}
