"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { employeeRequestTypeLabels, employeeRequestStatusLabels, employeeRequestStatusColors, employeeRequestIcons } from "@/data/employeeData";
import { useAuth } from "@/lib/authContext";

export default function EmployeeRecentRequests() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");

  const fetchRequests = useCallback(() => {
    if (!user?.id || !token) return;

    fetch(`/api/requests?userId=${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRequests(data?.requests || []))
      .catch(() => setRequests([]));
  }, [user?.id, token]);

  useEffect(() => {
    if (!user?.id || !token) return;

    fetchRequests();
    window.addEventListener("employee-request-created", fetchRequests);
    return () => window.removeEventListener("employee-request-created", fetchRequests);
  }, [fetchRequests, user?.id, token]);

  const handleCancelRequest = async (requestId: string) => {
    if (!user?.id || cancelingId) return;
    const confirmed = confirm("Batalkan pengajuan ini? Pengajuan akan hilang dari daftar approval admin.");
    if (!confirmed) return;

    setCancelingId(requestId);
    setCancelError("");

    try {
      const response = await fetch(`/api/requests/${requestId}?userId=${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        setCancelError(data.error || "Pengajuan gagal dibatalkan.");
        return;
      }

      await fetchRequests();
      window.dispatchEvent(new Event("employee-request-created"));
    } catch {
      setCancelError("Terjadi kesalahan koneksi saat membatalkan pengajuan.");
    } finally {
      setCancelingId(null);
    }
  };

  const getIconBgColor = (type: string) => {
    switch (type) {
      case "SHIFT_PAGI":
        return "bg-primary-container";
      case "SHIFT_MIDDLE":
      case "SHIFT_SIANG":
        return "bg-tertiary-container";
      case "SHIFT_MALAM":
        return "bg-secondary-container";
      case "CUTI_TAHUNAN":
        return "bg-tertiary-container";
      case "CUTI_SAKIT":
        return "bg-error-container";
      case "TUKAR_SHIFT":
        return "bg-surface-dim";
      default:
        return "bg-primary-container";
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs text-on-surface-variant uppercase tracking-wider">
          Pengajuan Terakhir
        </h2>
        <Link href="/pegawai/requests" className="text-[10px] text-primary font-bold hover:underline">
          LIHAT SEMUA
        </Link>
      </div>
      <div className="space-y-2">
        {cancelError && (
          <div className="rounded-lg border border-error/20 bg-error-container p-3 text-sm text-on-error-container">
            {cancelError}
          </div>
        )}
        {requests.length === 0 ? (
          <div className="p-4 text-center text-sm text-outline bg-surface-container border border-outline-variant rounded-lg">
            Belum ada pengajuan
          </div>
        ) : requests.slice(0, 5).map((request) => {
          const status = request.status.toLowerCase();
          const startDate = new Date(request.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
          const endDate = request.endDate
            ? new Date(request.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
            : "";
          return (
          <div
            key={request.id}
            className="bg-surface-container border border-outline-variant rounded-lg"
          >
            <div className="flex items-center gap-3 p-3">
              <div className={`w-10 h-10 rounded flex items-center justify-center ${getIconBgColor(request.type)}`}>
                <span className="material-symbols-outlined text-primary">
                  {employeeRequestIcons[request.type as keyof typeof employeeRequestIcons] || "assignment"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">
                  {employeeRequestTypeLabels[request.type as keyof typeof employeeRequestTypeLabels] || request.type}
                </p>
                <p className="text-[10px] text-secondary">
                  {endDate ? `${startDate} - ${endDate}` : startDate}
                  {request.swapWithUser?.name ? ` dengan ${request.swapWithUser.name}` : ""}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded ${employeeRequestStatusColors[status as keyof typeof employeeRequestStatusColors]}`}
              >
                {employeeRequestStatusLabels[status as keyof typeof employeeRequestStatusLabels]}
              </span>
            </div>
            {request.status === "PENDING" && request.userId === user?.id && (
              <div className="border-t border-outline-variant px-3 py-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleCancelRequest(request.id)}
                  disabled={cancelingId === request.id}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-error/20 px-3 text-[11px] font-bold text-error active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {cancelingId === request.id ? "progress_activity" : "close"}
                  </span>
                  {cancelingId === request.id ? "Membatalkan..." : "Batalkan"}
                </button>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}
