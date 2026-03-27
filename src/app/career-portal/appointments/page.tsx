"use client";

import { useEffect, useState } from "react";
import { AppointmentSlotWithBookings, APPOINTMENT_STATUS_LABELS } from "@/types";

type FormState = {
  startsAt: string;
  durationMinutes: string;
  maxBookings: string;
  notes: string;
};

export default function AppointmentsPage() {
  const [slots, setSlots] = useState<AppointmentSlotWithBookings[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>({
    startsAt: "",
    durationMinutes: "30",
    maxBookings: "1",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = () => {
    setLoading(true);
    fetch("/api/career-portal/appointment-slots")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/career-portal/appointment-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: new Date(form.startsAt).toISOString(),
          durationMinutes: Number(form.durationMinutes),
          maxBookings: Number(form.maxBookings),
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "作成に失敗しました");
        return;
      }
      setShowForm(false);
      setForm({ startsAt: "", durationMinutes: "30", maxBookings: "1", notes: "" });
      fetchSlots();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (slotId: string) => {
    if (!confirm("この相談枠をキャンセルしますか？")) return;
    await fetch(`/api/career-portal/appointment-slots/${slotId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCancelled: true }),
    });
    fetchSlots();
  };

  const handleCancelBooking = async (slotId: string, bookingId: string) => {
    if (!confirm("この予約をキャンセルしますか？")) return;
    await fetch(`/api/career-portal/appointment-slots/${slotId}/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });
    fetchSlots();
  };

  const formatDate = (isoString: string) =>
    new Date(isoString).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">相談予約管理</h1>
          <p className="text-sm text-gray-500 mt-1">キャリアセンター相談の枠管理と予約確認</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新規枠を作成
        </button>
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-blue-200 p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-gray-700">新規相談枠</h2>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">日時 *</label>
              <input
                required
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">所要時間</label>
              <select
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="30">30分</option>
                <option value="45">45分</option>
                <option value="60">60分</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">定員</label>
              <select
                value={form.maxBookings}
                onChange={(e) => setForm({ ...form, maxBookings: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}名</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">メモ（任意）</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="場所・持ち物など"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "作成中..." : "作成"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* スロット一覧 */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : slots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-3xl mb-2">📅</p>
          <p className="text-gray-400 text-sm">相談枠がまだ登録されていません</p>
          <p className="text-gray-300 text-xs mt-1">「新規枠を作成」から追加してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`bg-white rounded-xl border p-5 space-y-3 ${
                slot.isCancelled ? "opacity-60 border-gray-200" : "border-gray-200"
              }`}
            >
              {/* スロットヘッダー */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-base">
                    📅
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatDate(slot.startsAt)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {slot.durationMinutes}分 ／ 定員{slot.maxBookings}名 ／ 予約{slot.bookingsCount}件
                    </p>
                    {slot.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">{slot.notes}</p>
                    )}
                    {slot.isCancelled && (
                      <span className="inline-block text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1">
                        キャンセル済み
                      </span>
                    )}
                  </div>
                </div>
                {!slot.isCancelled && (
                  <button
                    type="button"
                    onClick={() => handleCancel(slot.id)}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                  >
                    枠をキャンセル
                  </button>
                )}
              </div>

              {/* 予約者リスト */}
              {slot.bookings.length > 0 && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">予約者</p>
                  {slot.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs shrink-0">
                          👤
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">
                            {booking.studentName ?? "（メール不明）"}
                          </p>
                          {(booking.studentFaculty || booking.studentGrade) && (
                            <p className="text-xs text-gray-400">
                              {[booking.studentFaculty, booking.studentGrade].filter(Boolean).join(" ")}
                            </p>
                          )}
                          {booking.studentMessage && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">「{booking.studentMessage}」</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {APPOINTMENT_STATUS_LABELS[booking.status]}
                        </span>
                        {booking.status === "confirmed" && !slot.isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(slot.id, booking.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors"
                          >
                            キャンセル
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
