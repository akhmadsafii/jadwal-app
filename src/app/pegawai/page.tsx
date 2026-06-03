"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";
import { useAuth } from "@/lib/authContext";
import { formatDateKey, getDateKeyFromApi, getLocalDateKey } from "@/lib/dateKeys";

type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

interface ShiftAssignment {
  date: string;
  dateKey?: string;
  shiftType: ShiftType;
}

interface EmployeeSchedule {
  id: string;
  name: string;
  position?: string | null;
  avatarUrl?: string | null;
  schedule: ShiftAssignment[];
}

interface ShiftRequest {
  id: string;
  type: string;
  startDate: string;
  endDate?: string | null;
  status: RequestStatus;
}

const shiftMeta: Record<ShiftType, {
  code: string;
  label: string;
  time: string;
  icon: string;
  pill: string;
  surface: string;
}> = {
  PAGI: {
    code: "P",
    label: "Pagi",
    time: "07:00 - 14:00",
    icon: "wb_sunny",
    pill: "bg-primary text-on-primary",
    surface: "bg-primary/10 text-primary border-primary/20",
  },
  MIDDLE: {
    code: "MID",
    label: "Middle",
    time: "10:00 - 17:00",
    icon: "schedule",
    pill: "bg-tertiary text-on-tertiary",
    surface: "bg-tertiary/10 text-tertiary border-tertiary/20",
  },
  SIANG: {
    code: "S",
    label: "Siang",
    time: "14:00 - 21:00",
    icon: "light_mode",
    pill: "bg-tertiary text-on-tertiary",
    surface: "bg-tertiary/10 text-tertiary border-tertiary/20",
  },
  MALAM: {
    code: "M",
    label: "Malam",
    time: "21:00 - 07:00",
    icon: "nightlight",
    pill: "bg-secondary text-on-secondary",
    surface: "bg-secondary/10 text-secondary border-secondary/20",
  },
  LIBUR: {
    code: "L",
    label: "Libur",
    time: "Tidak bertugas",
    icon: "weekend",
    pill: "bg-surface-container-highest text-on-surface-variant",
    surface: "bg-surface-container text-on-surface-variant border-outline-variant",
  },
  CUTI: {
    code: "C",
    label: "Cuti",
    time: "Cuti",
    icon: "beach_access",
    pill: "bg-primary-container text-on-primary-container",
    surface: "bg-primary/10 text-primary border-primary/20",
  },
  SAKIT: {
    code: "CS",
    label: "Cuti Sakit",
    time: "Izin / sakit",
    icon: "medical_services",
    pill: "bg-error text-on-error",
    surface: "bg-error-container text-on-error-container border-error/20",
  },
  TURUN: {
    code: "X",
    label: "Turun Jaga",
    time: "Turun jaga",
    icon: "event_busy",
    pill: "bg-error text-on-error",
    surface: "bg-error-container text-on-error-container border-error/20",
  },
};

const requestStatusMeta: Record<RequestStatus, { label: string; color: string; icon: string }> = {
  PENDING: { label: "Menunggu", color: "bg-secondary-container text-on-secondary-container", icon: "pending_actions" },
  APPROVED: { label: "Disetujui", color: "bg-green-100 text-green-800", icon: "check_circle" },
  REJECTED: { label: "Ditolak", color: "bg-error-container text-on-error-container", icon: "cancel" },
  EXPIRED: { label: "Lewat", color: "bg-outline-variant text-on-surface-variant", icon: "history" },
};

const requestTypeLabels: Record<string, string> = {
  SHIFT_PAGI: "Shift Pagi",
  SHIFT_MIDDLE: "Shift Middle",
  SHIFT_SIANG: "Shift Siang",
  SHIFT_MALAM: "Shift Malam",
  CUTI_TAHUNAN: "Cuti Tahunan",
  CUTI_SAKIT: "Izin / Sakit",
  TUKAR_SHIFT: "Tukar Shift",
};

function getDateKey(date: Date) {
  return getLocalDateKey(date);
}

function formatDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(dateKey: string) {
  return formatDateKey(dateKey, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getDisplayName(name?: string) {
  if (!name) return "Pegawai";
  return name.split(",")[0].trim();
}

function isWorkShift(shiftType: ShiftType) {
  return !["LIBUR", "CUTI", "SAKIT", "TURUN"].includes(shiftType);
}

function getAssignmentKey(assignment: ShiftAssignment) {
  return assignment.dateKey || getDateKeyFromApi(assignment.date);
}

export default function PegawaiPage() {
  const { user, token } = useAuth();
  const [schedule, setSchedule] = useState<ShiftAssignment[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeSchedule[]>([]);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState({ annualLeave: 12, sickLeave: 0, compensation: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const todayKey = getDateKey(now);

  const todayShift = useMemo(() => {
    return schedule.find((assignment) => getAssignmentKey(assignment) === todayKey)?.shiftType || "LIBUR";
  }, [schedule, todayKey]);

  const nextShifts = useMemo(() => {
    return schedule
      .filter((assignment) => getAssignmentKey(assignment) >= todayKey)
      .sort((a, b) => getAssignmentKey(a).localeCompare(getAssignmentKey(b)))
      .slice(0, 5);
  }, [schedule, todayKey]);

  const monthSummary = useMemo(() => {
    return schedule.reduce(
      (acc, assignment) => {
        if (isWorkShift(assignment.shiftType)) acc.work += 1;
        if (assignment.shiftType === "MALAM") acc.night += 1;
        if (assignment.shiftType === "LIBUR") acc.off += 1;
        if (assignment.shiftType === "CUTI") acc.leave += 1;
        return acc;
      },
      { work: 0, night: 0, off: 0, leave: 0 }
    );
  }, [schedule]);

  const coworkersToday = useMemo(() => {
    return allEmployees
      .map((employee) => {
        const shiftType = employee.schedule.find((assignment) => getAssignmentKey(assignment) === todayKey)?.shiftType || "LIBUR";
        return { ...employee, shiftType };
      })
      .filter((employee) => employee.id !== user?.id && isWorkShift(employee.shiftType))
      .slice(0, 4);
  }, [allEmployees, todayKey, user?.id]);

  const requestSummary = useMemo(() => {
    return requests.reduce(
      (acc, request) => {
        acc[request.status] += 1;
        return acc;
      },
      { PENDING: 0, APPROVED: 0, REJECTED: 0, EXPIRED: 0 } as Record<RequestStatus, number>
    );
  }, [requests]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.id || !token) return;

      setIsLoading(true);
      try {
        const [balanceRes, ownScheduleRes, allScheduleRes, requestsRes] = await Promise.all([
          fetch(`/api/users/${user.id}/balance`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/schedules?userId=${user.id}&month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/schedules?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/requests?userId=${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (balanceRes.ok) {
          const data = await balanceRes.json();
          if (data.balance) setLeaveBalance(data.balance);
        }

        if (ownScheduleRes.ok) {
          const data = await ownScheduleRes.json();
          setSchedule(data.schedule || []);
        }

        if (allScheduleRes.ok) {
          const data = await allScheduleRes.json();
          setAllEmployees(data.employees || []);
        }

        if (requestsRes.ok) {
          const data = await requestsRes.json();
          setRequests(data.requests || []);
        }
      } catch (error) {
        console.error("Failed to fetch employee dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [user?.id, token, month, year]);

  const todayMeta = shiftMeta[todayShift];

  return (
    <div className="min-h-screen pb-[132px] bg-background">
      <EmployeeTopBar />

      <main className="px-container-margin max-w-2xl mx-auto">
        <section className="py-4">
          <p className="text-sm text-on-surface-variant">{formatDate(now)}</p>
          <h1 className="text-2xl font-bold text-on-surface mt-1">
            Halo, {getDisplayName(user?.name)}
          </h1>
        </section>

        <section className={`rounded-2xl border p-4 ${todayMeta.surface}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Jadwal Hari Ini</p>
              <h2 className="text-2xl font-bold mt-2">{todayMeta.label}</h2>
              <p className="text-sm mt-1 opacity-85">{todayMeta.time}</p>
              <p className="text-xs mt-3 opacity-75">{user?.position || "Farmasi"}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${todayMeta.pill}`}>
              <span className="material-symbols-outlined text-[30px]">{todayMeta.icon}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Link
              href="/pegawai/roster"
              className="h-11 rounded-xl bg-surface-container-lowest/80 border border-outline-variant flex items-center justify-center gap-2 text-sm font-bold text-on-surface active:scale-[0.98] transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Roster Saya
            </Link>
            <Link
              href="/pegawai/staff"
              className="h-11 rounded-xl bg-surface-container-lowest/80 border border-outline-variant flex items-center justify-center gap-2 text-sm font-bold text-on-surface active:scale-[0.98] transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">groups</span>
              Jadwal Teman
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-2 py-4">
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center">
            <p className="text-lg font-bold text-primary">{monthSummary.work}</p>
            <p className="text-[10px] text-outline">Dinas</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center">
            <p className="text-lg font-bold text-secondary">{monthSummary.night}</p>
            <p className="text-[10px] text-outline">Malam</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center">
            <p className="text-lg font-bold text-on-surface">{monthSummary.off}</p>
            <p className="text-[10px] text-outline">Libur</p>
          </div>
          <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center">
            <p className="text-lg font-bold text-tertiary">{leaveBalance.annualLeave}</p>
            <p className="text-[10px] text-outline">Cuti</p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-on-surface">Aksi Cepat</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Link href="/pegawai/roster" className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center active:scale-[0.98] transition-transform">
              <span className="material-symbols-outlined text-primary">edit_calendar</span>
              <p className="text-xs font-bold mt-1">Ajukan</p>
            </Link>
            <Link href="/pegawai/staff" className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center active:scale-[0.98] transition-transform">
              <span className="material-symbols-outlined text-primary">travel_explore</span>
              <p className="text-xs font-bold mt-1">Cek Bentrok</p>
            </Link>
            <Link href="/pegawai/requests" className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 text-center active:scale-[0.98] transition-transform">
              <span className="material-symbols-outlined text-primary">pending_actions</span>
              <p className="text-xs font-bold mt-1">Status</p>
            </Link>
          </div>
        </section>

        <section className="mt-5 rounded-xl bg-surface-container-lowest border border-outline-variant p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-on-surface">Status Pengajuan</h2>
            <Link href="/pegawai/requests" className="text-xs font-bold text-primary">Detail</Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-surface-container p-3">
              <p className="text-lg font-bold text-on-surface">{requestSummary.PENDING}</p>
              <p className="text-[10px] text-outline">Menunggu</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <p className="text-lg font-bold text-green-700">{requestSummary.APPROVED}</p>
              <p className="text-[10px] text-green-700">Disetujui</p>
            </div>
            <div className="rounded-lg bg-error-container p-3">
              <p className="text-lg font-bold text-on-error-container">{requestSummary.REJECTED}</p>
              <p className="text-[10px] text-on-error-container">Ditolak</p>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-on-surface">Jadwal Terdekat</h2>
            <Link href="/pegawai/roster" className="text-xs font-bold text-primary">Lihat semua</Link>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-[70px] rounded-xl bg-surface-container animate-pulse" />
              ))
            ) : nextShifts.length === 0 ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 text-center text-sm text-on-surface-variant">
                Belum ada jadwal bulan ini
              </div>
            ) : (
              nextShifts.map((assignment) => {
                const key = getAssignmentKey(assignment);
                const meta = shiftMeta[assignment.shiftType];
                return (
                  <div key={key} className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${meta.pill}`}>
                      <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface">{formatShortDate(key)}</p>
                      <p className="text-xs text-on-surface-variant">{meta.label} - {meta.time}</p>
                    </div>
                    {key === todayKey && <span className="text-[10px] font-bold text-primary">Hari ini</span>}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-on-surface">Teman Dinas Hari Ini</h2>
            <Link href="/pegawai/staff" className="text-xs font-bold text-primary">Semua</Link>
          </div>
          <div className="space-y-2">
            {coworkersToday.length === 0 ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 text-center text-sm text-on-surface-variant">
                Belum ada rekan dinas yang tercatat hari ini
              </div>
            ) : (
              coworkersToday.map((employee) => {
                const meta = shiftMeta[employee.shiftType];
                return (
                  <div key={employee.id} className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex-shrink-0">
                      {employee.avatarUrl ? (
                        <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant flex items-center justify-center h-full">person</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface truncate">{employee.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{employee.position || "Pegawai"}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${meta.pill}`}>{meta.code}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {requests.length > 0 && (
          <section className="mt-5 mb-2">
            <h2 className="text-sm font-bold text-on-surface mb-3">Pengajuan Terakhir</h2>
            <div className="space-y-2">
              {requests.slice(0, 3).map((request) => {
                const status = requestStatusMeta[request.status];
                return (
                  <div key={request.id} className="rounded-xl bg-surface-container-lowest border border-outline-variant p-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.color}`}>
                      <span className="material-symbols-outlined text-[20px]">{status.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-on-surface truncate">{requestTypeLabels[request.type] || request.type}</p>
                      <p className="text-xs text-on-surface-variant">{formatShortDate(getDateKeyFromApi(request.startDate))}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${status.color}`}>{status.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <EmployeeBottomNav />
    </div>
  );
}
