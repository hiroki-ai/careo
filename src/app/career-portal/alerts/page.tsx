"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ALERT_TYPE_LABELS, AlertType } from "@/types";

interface Alert {
  id: string;
  studentUserId: string;
  alertType: AlertType;
  alertDetail: Record<string, unknown> | null;
  isResolved: boolean;
  createdAt: string;
}

const ALERT_COLORS: Record<AlertType, string> = {
  inactive_30d: "bg-gray-100 text-gray-700",
  no_companies_late: "bg-red-100 text-red-700",
  consecutive_rejections: "bg-orange-100 text-orange-700",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchAlerts = () => {
    setLoading(true);
    fetch("/api/career-portal/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAlerts(); }, []);

  const resolve = async (alertId: string) => {
    setResolving(alertId);
    await fetch("/api/career-portal/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alertId }),
    });
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setResolving(null);
  };

  const grouped = alerts.reduce<Record<AlertType, Alert[]>>((acc, a) => {
    if (!acc[a.alertType]) acc[a.alertType] = [];
    acc[a.alertType].push(a);
    return acc;
  }, {} as Record<AlertType, Alert[]>);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">要注意学生アラート</h1>
        <p className="text-sm text-gray-500 mt-1">
          支援が必要な可能性のある学生を自動検知します。確認・対応後は解決済みにしてください。
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-gray-500">現在、未解決のアラートはありません</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, list]) => (
          <div key={type} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ALERT_COLORS[type as AlertType]}`}>
                  {ALERT_TYPE_LABELS[type as AlertType]}
                </span>
                <span className="text-sm text-gray-500">{list.length}名</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {list.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">👤</div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {alert.alertType === "inactive_30d" && alert.alertDetail &&
                          `${alert.alertDetail.daysSinceLogin}日間未ログイン`}
                        {alert.alertType === "no_companies_late" && "本選考期に企業登録なし"}
                        {alert.alertType === "consecutive_rejections" && "直近5社すべて不採用"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(alert.createdAt).toLocaleDateString("ja-JP")} 検知
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/career-portal/students/${alert.studentUserId}`}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                    >
                      学生詳細
                    </Link>
                    <button
                      type="button"
                      onClick={() => resolve(alert.id)}
                      disabled={resolving === alert.id}
                      className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {resolving === alert.id ? "..." : "解決済み"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
