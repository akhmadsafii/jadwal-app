"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";

const requestTypeLabels: Record<string, string> = {
  SHIFT_PAGI: "Shift Pagi",
  SHIFT_MIDDLE: "Shift Middle",
  SHIFT_SIANG: "Shift Siang",
  SHIFT_MALAM: "Shift Malam",
  CUTI_TAHUNAN: "Cuti Tahunan",
  CUTI_SAKIT: "Cuti Sakit",
  TUKAR_SHIFT: "Tukar Shift",
};
const requestStatusLabels: Record<string, string> = {
  PENDING: "PENDING",
  APPROVED: "DISETUJUI",
  EXPIRED: "EXPIRED",
  REJECTED: "DITOLAK",
};
const requestStatusColors: Record<string, string> = {
  PENDING: "bg-secondary-container text-on-secondary-container",
  APPROVED: "bg-green-100 text-green-800",
  EXPIRED: "bg-outline-variant text-on-surface-variant",
  REJECTED: "bg-error-container text-on-error-container",
};
const requestIcons: Record<string, string> = {
  SHIFT_PAGI: "calendar_add_on",
  SHIFT_MIDDLE: "schedule",
  SHIFT_SIANG: "light_mode",
  SHIFT_MALAM: "nightlight",
  CUTI_TAHUNAN: "beach_access",
  CUTI_SAKIT: "medical_services",
  TUKAR_SHIFT: "swap_horiz",
};
const requestIconBg: Record<string, string> = {
  SHIFT_PAGI: "bg-primary-container",
  SHIFT_MIDDLE: "bg-tertiary-container",
  SHIFT_SIANG: "bg-tertiary-container",
  SHIFT_MALAM: "bg-secondary-container",
  CUTI_TAHUNAN: "bg-tertiary-container",
  CUTI_SAKIT: "bg-error-container",
  TUKAR_SHIFT: "bg-surface-dim",
};

export default function RecentRequests() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id || !token) return;

    fetch(`/api/requests?userId=${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setRequests(data?.requests || []))
      .catch(() => setRequests([]));
  }, [user?.id, token]);

  return (
    <section>
      <h2 className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
        Pengajuan Terakhir
      </h2>
      <div className="space-y-2">
        {requests.length === 0 ? (
          <div className="p-4 text-center text-sm text-outline bg-surface-container border border-outline-variant rounded-lg">
            Belum ada pengajuan
          </div>
        ) : requests.slice(0, 5).map((request) => {
          const startDate = new Date(request.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
          const endDate = request.endDate
            ? new Date(request.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
            : "";
          return (
          <div
            key={request.id}
            className="flex items-center gap-3 p-3 bg-surface-container border border-outline-variant rounded-lg"
          >
            <div
              className={`w-10 h-10 rounded ${requestIconBg[request.type]} flex items-center justify-center`}
            >
              <span className="material-symbols-outlined text-primary">
                {requestIcons[request.type]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body-md font-semibold truncate">
                {requestTypeLabels[request.type]}
              </p>
              <p className="font-label text-label-sm text-secondary">
                {request.endDate
                  ? `${startDate} - ${endDate}`
                  : startDate}
              </p>
            </div>
            <span
              className={`text-label-xs font-bold px-2 py-1 rounded ${requestStatusColors[request.status]}`}
            >
              {requestStatusLabels[request.status]}
            </span>
          </div>
          );
        })}
      </div>
    </section>
  );
}
