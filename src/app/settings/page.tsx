"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { JOB_SEARCH_STAGE_LABELS } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, loading, saveProfile } = useProfile();
  const { permission, isSubscribed, isSupported, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      alert("アカウントの削除に失敗しました。しばらく後に再試行してください。");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-400 text-sm">読み込み中...</div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-sm text-gray-500 mt-1">プロフィールとアカウントを管理</p>
      </div>

      {/* プロフィール */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-900">プロフィール</h2>
            <p className="text-xs text-gray-400 mt-0.5">AIアドバイスの精度に影響します</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { setIsEditingProfile(!isEditingProfile); setSaved(false); }}
          >
            {isEditingProfile ? "キャンセル" : "編集"}
          </Button>
        </div>

        {!isEditingProfile && profile && (
          <div className="space-y-3">
            {[
              { label: "大学", value: profile.university || "未設定" },
            { label: "学部・研究科", value: profile.faculty || "未設定" },
            { label: "学年", value: profile.grade },
              { label: "卒業予定", value: `${profile.graduationYear}年卒` },
              { label: "就活の進み具合", value: JOB_SEARCH_STAGE_LABELS[profile.jobSearchStage] },
              {
                label: "志望業界",
                value: profile.targetIndustries.length > 0 ? profile.targetIndustries.join("、") : "未設定",
              },
              {
                label: "志望職種",
                value: profile.targetJobs.length > 0 ? profile.targetJobs.join("、") : "未設定",
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-400 w-24 shrink-0">{label}</span>
                <span className="text-sm text-gray-800 break-all">{value}</span>
              </div>
            ))}
          </div>
        )}

        {!isEditingProfile && !profile && (
          <p className="text-sm text-gray-400">プロフィールが設定されていません</p>
        )}

        {isEditingProfile && (
          <>
            <ProfileForm
              initialData={profile ?? undefined}
              onSubmit={async (data) => {
                await saveProfile(data);
                setIsEditingProfile(false);
                setSaved(true);
              }}
              submitLabel="保存する"
            />
            {saved && <p className="text-sm text-green-600 mt-2">保存しました</p>}
          </>
        )}
      </section>

      {/* AIについて */}
      <section className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">AIアドバイスについて</h2>
        <p className="text-xs text-gray-400 mb-4">Careoの集合知</p>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex gap-3 items-start">
            <span className="text-blue-500 mt-0.5 shrink-0">●</span>
            <p>あなたの就活データは匿名化された形でCareoの集合知に活用されます</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-blue-500 mt-0.5 shrink-0">●</span>
            <p>ユーザーが増えるほど、AIアドバイスの精度が向上します</p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-blue-500 mt-0.5 shrink-0">●</span>
            <p>個人を特定する情報（企業名・氏名など）はAI学習に使用されません</p>
          </div>
        </div>
      </section>

      {/* 通知設定 */}
      {isSupported && (
        <section className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">プッシュ通知</h2>
          <p className="text-xs text-gray-400 mb-4">ES締切・面接前日にお知らせします</p>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700">締切・面接リマインダー</p>
              <p className="text-xs text-gray-400">
                {permission === "denied" ? "ブラウザの設定から通知を許可してください" : isSubscribed ? "オン" : "オフ"}
              </p>
            </div>
            {permission !== "denied" && (
              <button
                type="button"
                title={isSubscribed ? "通知をオフにする" : "通知をオンにする"}
                disabled={pushLoading}
                onClick={isSubscribed ? unsubscribe : subscribe}
                className={`relative w-12 h-6 rounded-full transition-colors ${isSubscribed ? "bg-[#00c896]" : "bg-gray-200"} disabled:opacity-60`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isSubscribed ? "translate-x-6" : ""}`} />
              </button>
            )}
          </div>
        </section>
      )}

      {/* アカウント */}
      <section className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">アカウント</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">ログアウト</p>
              <p className="text-xs text-gray-400">このデバイスからサインアウトします</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-red-600">アカウントを削除</p>
              <p className="text-xs text-gray-400">すべてのデータが完全に削除されます</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => { setIsDeleteConfirm(true); setDeleteInput(""); }}>
              削除
            </Button>
          </div>
        </div>
      </section>

      {/* アカウント削除確認 */}
      {isDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">アカウントを削除しますか？</h3>
            <p className="text-sm text-gray-500 mb-4">
              企業・ES・面接・OB訪問など<span className="font-medium text-red-600">すべてのデータが完全に削除</span>され、元に戻せません。
            </p>
            <p className="text-sm text-gray-600 mb-2">
              確認のため <span className="font-mono font-bold">削除する</span> と入力してください
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="削除する"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== "削除する" || deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white disabled:opacity-40 hover:bg-red-700 transition-colors"
              >
                {deleting ? "削除中..." : "完全に削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
