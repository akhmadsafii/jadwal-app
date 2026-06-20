"use client";

import { useEffect, useState } from "react";
import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";
import { useAuth } from "@/lib/authContext";

interface AppNotification {
  id: string;
  requestId?: string | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function formatNotificationTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EmployeeNotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingRequestId, setRespondingRequestId] = useState<string | null>(null);

  const loadNotifications = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  // Token menentukan sesi yang dipakai untuk mengambil notifikasi.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const respondToSwap = async (notification: AppNotification, decision: "APPROVED" | "REJECTED") => {
    if (!token || !notification.requestId || respondingRequestId) return;
    setRespondingRequestId(notification.requestId);
    try {
      const response = await fetch("/api/requests/respond-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ requestId: notification.requestId, decision }),
      });
      if (!response.ok) throw new Error("Gagal menanggapi tukar shift");
      await loadNotifications();
    } catch (error) {
      console.error("Failed to respond to swap:", error);
      alert("Gagal menanggapi tukar shift. Silakan coba lagi.");
    } finally {
      setRespondingRequestId(null);
    }
  };

  return (
    <div className="min-h-screen pb-[96px] bg-background">
      <EmployeeTopBar />
      <main className="px-container-margin max-w-2xl mx-auto py-4">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-on-surface">Riwayat Notifikasi</h2>
          <p className="text-sm text-on-surface-variant mt-1">Permintaan tukar shift dan pembaruan status pengajuan.</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-28 rounded-xl bg-surface-container animate-pulse" />
            <div className="h-28 rounded-xl bg-surface-container animate-pulse" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
            Belum ada notifikasi.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const needsAction = notification.type === "SHIFT_SWAP_REQUEST" && notification.requestId;
              const isResponding = respondingRequestId === notification.requestId;
              return (
                <article key={notification.id} className={`rounded-xl border p-4 ${notification.isRead ? "bg-surface-container-lowest border-outline-variant" : "bg-primary/5 border-primary/20"}`}>
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-none ${notification.isRead ? "bg-surface-container text-outline" : "bg-primary/10 text-primary"}`}>
                      <span className="material-symbols-outlined">{notification.type.includes("SWAP") ? "swap_horiz" : "notifications"}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-on-surface">{notification.title}</h3>
                        {!notification.isRead && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-none" />}
                      </div>
                      <p className="text-sm text-on-surface-variant mt-1">{notification.message}</p>
                      <p className="text-[11px] text-outline mt-2">{formatNotificationTime(notification.createdAt)}</p>
                    </div>
                  </div>
                  {needsAction && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button
                        onClick={() => respondToSwap(notification, "REJECTED")}
                        disabled={Boolean(isResponding)}
                        className="h-10 rounded-lg border border-error/30 text-error text-xs font-bold disabled:opacity-60"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => respondToSwap(notification, "APPROVED")}
                        disabled={Boolean(isResponding)}
                        className="h-10 rounded-lg bg-primary text-on-primary text-xs font-bold disabled:opacity-60"
                      >
                        {isResponding ? "Memproses..." : "Setujui"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
      <EmployeeBottomNav />
    </div>
  );
}
