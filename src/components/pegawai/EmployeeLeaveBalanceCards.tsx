"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";

interface ShiftRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  createdAt: string;
}

const statMeta = [
  {
    key: "pending",
    label: "Menunggu",
    icon: "pending_actions",
    color: "text-tertiary",
    surface: "bg-tertiary/10",
  },
  {
    key: "approved",
    label: "Disetujui",
    icon: "task_alt",
    color: "text-primary",
    surface: "bg-primary/10",
  },
  {
    key: "rejected",
    label: "Ditolak",
    icon: "cancel",
    color: "text-error",
    surface: "bg-error/10",
  },
  {
    key: "thisMonth",
    label: "Bulan Ini",
    icon: "calendar_month",
    color: "text-secondary",
    surface: "bg-secondary/10",
  },
] as const;

export default function EmployeeLeaveBalanceCards() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<ShiftRequest[]>([]);

  useEffect(() => {
    if (!user?.id || !token) return;

    const fetchRequests = () => {
      fetch(`/api/requests?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => setRequests(data?.requests || []))
        .catch(() => setRequests([]));
    };

    fetchRequests();
    window.addEventListener("employee-request-created", fetchRequests);
    return () => window.removeEventListener("employee-request-created", fetchRequests);
  }, [user?.id, token]);

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return {
      pending: requests.filter((request) => request.status === "PENDING").length,
      approved: requests.filter((request) => request.status === "APPROVED").length,
      rejected: requests.filter((request) => request.status === "REJECTED").length,
      thisMonth: requests.filter((request) => {
        const createdAt = new Date(request.createdAt);
        return createdAt.getMonth() === month && createdAt.getFullYear() === year;
      }).length,
    };
  }, [requests]);

  return (
    <section>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {statMeta.map((item) => (
          <div
            key={item.key}
            className="flex-none w-36 p-3 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-on-surface-variant">{item.label}</p>
              <span className={`material-symbols-outlined text-[18px] ${item.color}`}>
                {item.icon}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-2">
              <span className={`text-xl font-bold ${item.color}`}>
                {stats[item.key].toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] text-secondary">pengajuan</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
