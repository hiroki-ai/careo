"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface GmailStatus {
  connected: boolean;
  email?: string;
  lastSyncedAt?: string;
}

export default function IntegrationsPage() {
  const search = useSearchParams();
  const [status, setStatus] = useState<GmailStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { showToast } = useToast();

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("gmail_credentials")
        .select("email, last_synced_at, is_active")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.is_active) {
        setStatus({ connected: true, email: data.email, lastSyncedAt: data.last_synced_at });
      } else {
        setStatus({ connected: false });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  useEffect(() => {
    if (search?.get("connected") === "1") {
      showToast("Gmailを接続しました", "success");
    }
    const error = search?.get("error");
    if (error) showToast(`接続に失敗: ${error}`, "error");
  }, [search, showToast]);

  const handleConnect = () => {
    window.location.href = "/api/auth/google/start";
  };

  const handleDisconnect = async () => {
    if (!confirm("Gmail連携を解除しますか？")) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("gmail_credentials").update({ is_active: false }).eq("user_id", user.id);
    showToast("解除しました", "success");
    fetchStatus();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(`${data.saved}件同期しました`, "success");
        fetchStatus();
      } else {
        showToast(`同期失敗: ${data.error}`, "error");
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">外部連携</h1>
        <p className="text-sm text-gray-500 mb-8">Gmailなどの外部サービスとCareoを接続します</p>

        {/* Gmail */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                📧
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-gray-900">Gmail連携</h2>
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    BETA
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  受信メールを企業ごとに自動仕分け。AIが「次にやるべきこと」を提案します。
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ) : status.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{status.email}</p>
                  {status.lastSyncedAt && (
                    <p className="text-xs text-gray-500">
                      最終同期: {new Date(status.lastSyncedAt).toLocaleString("ja-JP")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSync} disabled={syncing} className="flex-1">
                  {syncing ? "同期中..." : "今すぐ同期"}
                </Button>
                <Button variant="secondary" onClick={handleDisconnect}>
                  解除
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ul className="text-xs text-gray-500 space-y-1.5 mb-4">
                <li>✓ 受信メール（過去30日）を読み取り</li>
                <li>✓ 送信元ドメインから自動で企業マッチング</li>
                <li>✓ メール送信・編集はしません（read-only）</li>
                <li>✓ いつでも解除できます</li>
              </ul>
              <Button onClick={handleConnect} className="w-full">
                Googleアカウントで接続
              </Button>
              <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                ※ 環境変数（GOOGLE_OAUTH_*）が未設定の場合は、まず設定が必要です
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-400 text-center">
          他の連携（カレンダー・Slack等）も順次追加予定
        </div>
      </div>
    </div>
  );
}
