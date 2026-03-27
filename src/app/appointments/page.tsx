"use client";

import { useEffect, useState } from "react";
import { AppointmentSlotForStudent, AppointmentBooking, APPOINTMENT_STATUS_LABELS } from "@/types";

type BookingWithSlot = AppointmentBooking & {
  slot: AppointmentSlotForStudent | null;
};

export default function AppointmentsPage() {
  const [slots, setSlots] = useState<AppointmentSlotForStudent[]>([]);
  const [bookings, setBookings] = useState<BookingWithSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // モーダル
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlotForStudent | null>(null);
  const [studentMessage, setStudentMessage] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const fetchSlots = () => {
    setLoadingSlots(true);
    fetch("/api/appointments/slots")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoadingSlots(false));
  };

  const fetchBookings = () => {
    setLoadingBookings(true);
    fetch("/api/appointments/bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings ?? []))
      .finally(() => setLoadingBookings(false));
  };

  useEffect(() => {
    fetchSlots();
    fetchBookings();
  }, []);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBooking(true);
    setBookingError(null);
    try {
      const res = await fetch("/api/appointments/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          studentMessage: studentMessage || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setBookingError(d.error ?? "予約に失敗しました");
        return;
      }
      setSelectedSlot(null);
      setStudentMessage("");
      fetchSlots();
      fetchBookings();
    } finally {
      setBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("この予約をキャンセルしますか？")) return;
    await fetch(`/api/appointments/bookings/${bookingId}`, {
      method: "PATCH",
    });
    fetchSlots();
    fetchBookings();
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

  const availableSlots = slots.filter(
    (s) => !s.isCancelled && s.availableCount > 0 && !s.myBooking
  );
  const bookedSlots = slots.filter((s) => s.myBooking?.status === "confirmed");

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const pastBookings = bookings.filter((b) => b.status !== "confirmed");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      {/* タイトル */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">キャリアセンター相談予約</h1>
        <p className="text-sm text-gray-500 mt-1">キャリアセンターのスタッフに相談できます</p>
      </div>

      {/* 予約中のスロット */}
      {bookedSlots.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">予約中</h2>
          {bookedSlots.map((slot) => (
            <div
              key={slot.id}
              className="bg-[#00c896]/5 border border-[#00c896]/30 rounded-xl p-4 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00c896]/10 flex items-center justify-center text-sm shrink-0">
                  📅
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(slot.startsAt)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{slot.durationMinutes}分</p>
                  {slot.notes && <p className="text-xs text-gray-400 mt-0.5">{slot.notes}</p>}
                  {slot.myBooking?.studentMessage && (
                    <p className="text-xs text-gray-400 mt-0.5 italic">「{slot.myBooking.studentMessage}」</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => slot.myBooking && handleCancelBooking(slot.myBooking.id)}
                className="text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                キャンセル
              </button>
            </div>
          ))}
        </section>
      )}

      {/* 利用可能スロット一覧 */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">予約可能な相談枠</h2>
        {loadingSlots ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00c896]" />
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-gray-400 text-sm">現在予約可能な枠はありません</p>
            <p className="text-gray-300 text-xs mt-1">キャリアセンターが枠を追加するまでお待ちください</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableSlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-3 hover:border-[#00c896]/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-sm shrink-0">
                    📅
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{formatDate(slot.startsAt)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{slot.durationMinutes}分</p>
                    {slot.notes && <p className="text-xs text-gray-400 mt-0.5">{slot.notes}</p>}
                    <p className="text-xs text-[#00c896] font-medium mt-0.5">残り{slot.availableCount}枠</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedSlot(slot); setBookingError(null); setStudentMessage(""); }}
                  className="text-xs bg-[#00c896] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#00a87e] transition-colors shrink-0"
                >
                  予約する
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 予約履歴 */}
      {(confirmedBookings.length > 0 || pastBookings.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">予約履歴</h2>
          {loadingBookings ? (
            <div className="flex items-center justify-center h-16">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400" />
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {bookings.map((b) => (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-800">
                      {b.slot ? formatDate(b.slot.startsAt) : "（スロット削除済み）"}
                    </p>
                    {b.slot && (
                      <p className="text-xs text-gray-400 mt-0.5">{b.slot.durationMinutes}分</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                      b.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {APPOINTMENT_STATUS_LABELS[b.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 予約モーダル */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedSlot(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-900">相談予約の確認</h2>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-gray-800">{formatDate(selectedSlot.startsAt)}</p>
              <p className="text-xs text-gray-500">{selectedSlot.durationMinutes}分</p>
              {selectedSlot.notes && (
                <p className="text-xs text-gray-400">{selectedSlot.notes}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">相談内容メモ（任意）</label>
              <textarea
                rows={3}
                value={studentMessage}
                onChange={(e) => setStudentMessage(e.target.value)}
                placeholder="相談したい内容を簡単に記入してください"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896] resize-none"
              />
            </div>
            {bookingError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{bookingError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBook}
                disabled={booking}
                className="flex-1 py-2.5 bg-[#00c896] text-white text-sm font-semibold rounded-xl hover:bg-[#00a87e] disabled:opacity-50 transition-colors"
              >
                {booking ? "予約中..." : "予約を確定する"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
