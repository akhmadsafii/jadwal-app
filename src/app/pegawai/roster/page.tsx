"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";
import { useAuth } from "@/lib/authContext";
import { dateKeyToLocalDate, getDateKeyFromApi, getLocalDateKey } from "@/lib/dateKeys";
import { useIndonesiaHolidays } from "@/hooks/useIndonesiaHolidays";

type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";
type FilterKey = "ALL" | "WORK" | "OFF" | "NIGHT";
type RequestType = "SHIFT_PAGI" | "SHIFT_MIDDLE" | "SHIFT_SIANG" | "SHIFT_MALAM" | "CUTI_TAHUNAN" | "CUTI_SAKIT" | "TUKAR_HARI" | "TUKAR_SHIFT";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

interface ShiftAssignment {
  date: string;
  dateKey?: string;
  shiftType: ShiftType;
  fromRequest?: boolean;
  pendingShiftType?: ShiftType;
  requestStatus?: RequestStatus;
}

interface DaySchedule {
  date: Date;
  dateKey: string;
  shiftType: ShiftType | null;
}

interface ShiftRequest {
  id: string;
  type: RequestType;
  startDate: string;
  endDate?: string | null;
  description?: string | null;
  status: RequestStatus;
}

interface EmployeeOption {
  id: string;
  name: string;
  nip: string;
  isActive?: boolean;
}

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const shiftMeta: Record<ShiftType, {
  code: string;
  label: string;
  time: string;
  icon: string;
  pill: string;
  surface: string;
  border: string;
}> = {
  PAGI: {
    code: "P",
    label: "Pagi",
    time: "07:00 - 14:00",
    icon: "wb_sunny",
    pill: "bg-primary text-on-primary",
    surface: "bg-primary/10 text-primary",
    border: "border-primary/20",
  },
  MIDDLE: {
    code: "MID",
    label: "Middle",
    time: "10:00 - 17:00",
    icon: "schedule",
    pill: "bg-tertiary text-on-tertiary",
    surface: "bg-tertiary/10 text-tertiary",
    border: "border-tertiary/20",
  },
  SIANG: {
    code: "S",
    label: "Siang",
    time: "14:00 - 21:00",
    icon: "light_mode",
    pill: "bg-tertiary text-on-tertiary",
    surface: "bg-tertiary/10 text-tertiary",
    border: "border-tertiary/20",
  },
  MALAM: {
    code: "M",
    label: "Malam",
    time: "21:00 - 07:00",
    icon: "nightlight",
    pill: "bg-secondary text-on-secondary",
    surface: "bg-secondary/10 text-secondary",
    border: "border-secondary/20",
  },
  LIBUR: {
    code: "L",
    label: "Libur",
    time: "Tidak bertugas",
    icon: "weekend",
    pill: "bg-surface-container-highest text-on-surface-variant",
    surface: "bg-surface-container text-on-surface-variant",
    border: "border-outline-variant",
  },
  CUTI: {
    code: "C",
    label: "Cuti",
    time: "Cuti",
    icon: "beach_access",
    pill: "bg-primary-container text-on-primary-container",
    surface: "bg-primary/10 text-primary",
    border: "border-primary/20",
  },
  SAKIT: {
    code: "CS",
    label: "Cuti Sakit",
    time: "Izin / sakit",
    icon: "medical_services",
    pill: "bg-error text-on-error",
    surface: "bg-error-container text-on-error-container",
    border: "border-error/20",
  },
  TURUN: {
    code: "X",
    label: "Turun Jaga",
    time: "Turun jaga",
    icon: "event_busy",
    pill: "bg-error text-on-error",
    surface: "bg-error-container text-on-error-container",
    border: "border-error/20",
  },
};

const filters: { key: FilterKey; label: string; icon: string }[] = [
  { key: "ALL", label: "Semua", icon: "calendar_month" },
  { key: "WORK", label: "Dinas", icon: "badge" },
  { key: "OFF", label: "Libur", icon: "weekend" },
  { key: "NIGHT", label: "Malam", icon: "nightlight" },
];

const requestTypeOptions: { value: RequestType; label: string }[] = [
  { value: "SHIFT_PAGI", label: "Shift Pagi (07:00 - 14:00)" },
  { value: "SHIFT_MIDDLE", label: "Shift Middle (10:00 - 17:00)" },
  { value: "SHIFT_SIANG", label: "Shift Siang (14:00 - 21:00)" },
  { value: "SHIFT_MALAM", label: "Shift Malam (21:00 - 07:00)" },
  { value: "CUTI_TAHUNAN", label: "Ajukan Cuti" },
  { value: "CUTI_SAKIT", label: "Izin / Sakit" },
  { value: "TUKAR_HARI", label: "Tukar Hari" },
  { value: "TUKAR_SHIFT", label: "Tukar Shift Karyawan" },
];

const requestTypeLabels: Record<RequestType, string> = {
  SHIFT_PAGI: "Shift Pagi",
  SHIFT_MIDDLE: "Shift Middle",
  SHIFT_SIANG: "Shift Siang",
  SHIFT_MALAM: "Shift Malam",
  CUTI_TAHUNAN: "Cuti Tahunan",
  CUTI_SAKIT: "Izin / Sakit",
  TUKAR_HARI: "Tukar Hari",
  TUKAR_SHIFT: "Tukar Shift Karyawan",
};

function getRequestTypeLabel(request: ShiftRequest) {
  if (request.type === "TUKAR_SHIFT" && request.endDate) return "Tukar Hari";
  return requestTypeLabels[request.type] || request.type;
}

const requestStatusMeta: Record<RequestStatus, {
  label: string;
  shortLabel: string;
  icon: string;
  badge: string;
  surface: string;
}> = {
  PENDING: {
    label: "Menunggu approval admin",
    shortLabel: "Menunggu",
    icon: "pending_actions",
    badge: "bg-secondary-container text-on-secondary-container",
    surface: "bg-secondary-container/50 border-secondary/30 text-on-secondary-container",
  },
  APPROVED: {
    label: "Sudah disetujui admin",
    shortLabel: "Disetujui",
    icon: "check_circle",
    badge: "bg-green-100 text-green-800",
    surface: "bg-green-50 border-green-200 text-green-800",
  },
  REJECTED: {
    label: "Ditolak admin",
    shortLabel: "Ditolak",
    icon: "cancel",
    badge: "bg-error-container text-on-error-container",
    surface: "bg-error-container border-error/20 text-on-error-container",
  },
  EXPIRED: {
    label: "Pengajuan sudah lewat",
    shortLabel: "Lewat",
    icon: "history",
    badge: "bg-outline-variant text-on-surface-variant",
    surface: "bg-surface-container border-outline-variant text-on-surface-variant",
  },
};

function getDateKey(date: Date) {
  return getLocalDateKey(date);
}

function apiDateToKey(value: string) {
  return getDateKeyFromApi(value);
}

function formatDay(date: Date) {
  return date.toLocaleDateString("id-ID", { weekday: "short" });
}

function formatFullDate(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isWorkShift(shiftType: ShiftType | null) {
  if (!shiftType) return false;
  return !["LIBUR", "CUTI", "SAKIT", "TURUN"].includes(shiftType);
}

function getRequestForDay(requests: ShiftRequest[], dateKey: string) {
  return requests
    .filter((request) => {
      const startKey = apiDateToKey(request.startDate);
      const endKey = request.endDate ? apiDateToKey(request.endDate) : startKey;
      if (request.type === "TUKAR_SHIFT" && request.endDate) {
        return dateKey === startKey || dateKey === endKey;
      }
      return dateKey >= startKey && dateKey <= endKey;
    })
    .sort((a, b) => {
      const priority: Record<RequestStatus, number> = {
        PENDING: 0,
        APPROVED: 1,
        REJECTED: 2,
        EXPIRED: 3,
      };
      return priority[a.status] - priority[b.status];
    })[0];
}

export default function PegawaiRosterPage() {
  const { user, token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState<ShiftAssignment[]>([]);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [selectedDay, setSelectedDay] = useState<DaySchedule | null>(null);
  const [requestType, setRequestType] = useState<RequestType>("CUTI_TAHUNAN");
  const [swapDayDate, setSwapDayDate] = useState(getLocalDateKey(new Date()));
  const [swapWithUserId, setSwapWithUserId] = useState("");
  const [requestDescription, setRequestDescription] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const monthName = `${monthNames[currentDate.getMonth()]} ${year}`;
  const holidays = useIndonesiaHolidays(year);

  const days = useMemo<DaySchedule[]>(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const scheduleByDate = new Map(
      schedule.map((assignment) => [
        assignment.dateKey || apiDateToKey(assignment.date),
        assignment.shiftType,
      ])
    );

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month - 1, index + 1);
      const dateKey = getDateKey(date);
      return {
        date,
        dateKey,
        shiftType: scheduleByDate.get(dateKey) || null,
      };
    });
  }, [month, schedule, year]);

  const todayKey = getDateKey(new Date());
  const todaySchedule = days.find((day) => day.dateKey === todayKey);
  const nextWorkShift = days.find((day): day is DaySchedule & { shiftType: ShiftType } => (
    day.dateKey >= todayKey && isWorkShift(day.shiftType)
  ));
  const selectedRequest = selectedDay ? getRequestForDay(requests, selectedDay.dateKey) : undefined;
  const selectedRequestLocked = selectedRequest?.status === "PENDING" || selectedRequest?.status === "APPROVED";
  const isDaySwapRequest = requestType === "TUKAR_HARI";
  const isEmployeeSwapRequest = requestType === "TUKAR_SHIFT";

  const summary = useMemo(() => {
    return days.reduce(
      (acc, day) => {
        if (isWorkShift(day.shiftType)) acc.work += 1;
        if (day.shiftType === "MALAM") acc.night += 1;
        if (day.shiftType === "LIBUR") acc.off += 1;
        if (day.shiftType === "CUTI") acc.leave += 1;
        return acc;
      },
      { work: 0, night: 0, off: 0, leave: 0 }
    );
  }, [days]);

  const filteredDays = days.filter((day) => {
    if (activeFilter === "WORK") return isWorkShift(day.shiftType);
    if (activeFilter === "OFF") return day.shiftType ? ["LIBUR", "CUTI", "SAKIT", "TURUN"].includes(day.shiftType) : false;
    if (activeFilter === "NIGHT") return day.shiftType === "MALAM";
    return true;
  });

  const goToPrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const fetchRequests = async () => {
    if (!user?.id || !token) return;

    try {
      const response = await fetch(`/api/requests?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
      setRequests([]);
    }
  };

  const fetchSchedule = useCallback(async () => {
    if (!user?.id || !token) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/schedules?userId=${user.id}&month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setSchedule(data.schedule || []);
      }
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
      setSchedule([]);
    } finally {
      setIsLoading(false);
    }
  }, [month, token, user?.id, year]);

  const fetchEmployees = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/users?role=EMPLOYEE");
      if (!response.ok) return;
      const data = await response.json();
      const users = (data.users || []).filter((employee: EmployeeOption) => (
        employee.id !== user.id && employee.isActive !== false
      ));
      setEmployees(users);
      setSwapWithUserId((current) => current || users[0]?.id || "");
    } catch (error) {
      console.error("Failed to fetch employee options:", error);
      setEmployees([]);
    }
  }, [user?.id]);

  const openRequestSheet = (day: DaySchedule) => {
    const defaultTypeByShift: Partial<Record<ShiftType, RequestType>> = {
      PAGI: "SHIFT_PAGI",
      MIDDLE: "SHIFT_MIDDLE",
      SIANG: "SHIFT_SIANG",
      MALAM: "SHIFT_MALAM",
      CUTI: "CUTI_TAHUNAN",
    };
    const defaultType = day.shiftType ? defaultTypeByShift[day.shiftType] || "CUTI_TAHUNAN" : "CUTI_TAHUNAN";
    const nextDate = new Date(day.date);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDay(day);
    setRequestType(defaultType);
    setSwapDayDate(getLocalDateKey(nextDate));
    setSwapWithUserId((current) => current || employees[0]?.id || "");
    setRequestDescription("");
    setSubmitStatus("idle");
  };

  const closeRequestSheet = () => {
    if (submitStatus === "submitting") return;
    setSelectedDay(null);
    setSubmitStatus("idle");
  };

  const submitRequest = async () => {
    if (!user?.id || !selectedDay) {
      setSubmitStatus("error");
      return;
    }

    if (isEmployeeSwapRequest && !swapWithUserId) {
      setSubmitStatus("error");
      return;
    }

    if (isDaySwapRequest && selectedDay.dateKey === swapDayDate) {
      setSubmitStatus("error");
      return;
    }

    const swapTarget = employees.find((employee) => employee.id === swapWithUserId);
    const confirmed = confirm(
      isEmployeeSwapRequest
        ? `Ajukan tukar shift tanggal ${formatFullDate(selectedDay.date)} dengan ${swapTarget?.name || "karyawan tujuan"}? Jadwal berubah setelah disetujui karyawan tujuan.`
        : isDaySwapRequest
          ? `Ajukan tukar hari ${formatFullDate(selectedDay.date)} dengan ${formatFullDate(dateKeyToLocalDate(swapDayDate))}? Jadwal berubah setelah disetujui admin.`
        : `Kirim pengajuan ${requestTypeLabels[requestType]} untuk tanggal ${formatFullDate(selectedDay.date)}?`
    );

    if (!confirmed) return;

    setSubmitStatus("submitting");

    try {
      const response = await fetch("/api/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: user.id,
          type: requestType,
          startDate: selectedDay.dateKey,
          endDate: isDaySwapRequest ? swapDayDate : selectedDay.dateKey,
          swapWithUserId: isEmployeeSwapRequest ? swapWithUserId : undefined,
          description: requestDescription || `Pengajuan dari jadwal tanggal ${formatFullDate(selectedDay.date)}`,
        }),
      });

      if (!response.ok) {
        setSubmitStatus("error");
        return;
      }

      setSubmitStatus("success");
      await fetchRequests();
      await fetchSchedule();
      setTimeout(() => {
        setSelectedDay(null);
        setSubmitStatus("idle");
      }, 900);
    } catch (error) {
      console.error("Failed to submit request:", error);
      setSubmitStatus("error");
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    fetchRequests();
  }, [user?.id, token]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <div className="min-h-screen pb-[132px] bg-background">
      <EmployeeTopBar />

      <main>
        <section className="px-container-margin pt-4 pb-3 bg-surface-container-lowest border-b border-outline-variant">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={goToPrevMonth}
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Bulan sebelumnya"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="text-center min-w-0">
              <p className="text-[10px] text-outline uppercase tracking-wider">Jadwal Saya</p>
              <h1 className="text-lg font-bold text-on-surface">{monthName}</h1>
            </div>
            <button
              onClick={goToNextMonth}
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Bulan berikutnya"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </section>

        <section className="px-container-margin py-4 space-y-3">
          <div className={`rounded-xl border p-4 ${shiftMeta[todaySchedule?.shiftType || "LIBUR"].surface} ${shiftMeta[todaySchedule?.shiftType || "LIBUR"].border}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold opacity-80">Hari ini</p>
                <h2 className="text-xl font-bold mt-1">{todaySchedule?.shiftType ? shiftMeta[todaySchedule.shiftType].label : "Belum diatur"}</h2>
                <p className="text-sm mt-1 opacity-80">{todaySchedule?.shiftType ? shiftMeta[todaySchedule.shiftType].time : "Jadwal belum dibuat"}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${shiftMeta[todaySchedule?.shiftType || "LIBUR"].pill}`}>
                <span className="material-symbols-outlined">{shiftMeta[todaySchedule?.shiftType || "LIBUR"].icon}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-3 text-center">
              <p className="text-lg font-bold text-primary">{summary.work}</p>
              <p className="text-[10px] text-outline">Dinas</p>
            </div>
            <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-3 text-center">
              <p className="text-lg font-bold text-secondary">{summary.night}</p>
              <p className="text-[10px] text-outline">Malam</p>
            </div>
            <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-3 text-center">
              <p className="text-lg font-bold text-on-surface">{summary.off}</p>
              <p className="text-[10px] text-outline">Libur</p>
            </div>
            <div className="rounded-lg bg-surface-container-lowest border border-outline-variant p-3 text-center">
              <p className="text-lg font-bold text-tertiary">{summary.leave}</p>
              <p className="text-[10px] text-outline">Cuti</p>
            </div>
          </div>

          {nextWorkShift && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-container border border-outline-variant p-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${shiftMeta[nextWorkShift.shiftType].surface}`}>
                <span className="material-symbols-outlined text-[20px]">{shiftMeta[nextWorkShift.shiftType].icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-outline">Dinas berikutnya</p>
                <p className="text-sm font-bold truncate">
                  {formatFullDate(nextWorkShift.date)} · {shiftMeta[nextWorkShift.shiftType].label}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="px-container-margin pb-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`flex-none h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  activeFilter === filter.key
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-20 rounded-xl bg-surface-container animate-pulse" />
              ))
            ) : filteredDays.length === 0 ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-outline">
                Tidak ada jadwal pada filter ini
              </div>
            ) : (
              filteredDays.map((item) => {
                const meta = item.shiftType ? shiftMeta[item.shiftType] : null;
                const isTodayItem = item.dateKey === todayKey;
                const holiday = holidays.get(item.dateKey);
                const isRedDate = item.date.getDay() === 0 || Boolean(holiday);
                const dayRequest = getRequestForDay(requests, item.dateKey);

                // Check if this day has a schedule from an approved request
                const scheduleEntry = schedule.find((s) => (s.dateKey || apiDateToKey(s.date)) === item.dateKey);
                const isFromRequest = scheduleEntry?.fromRequest || false;
                const isPendingRequest = scheduleEntry?.requestStatus === "PENDING";
                const pendingShiftType = scheduleEntry?.pendingShiftType;
                const showPreviousAndRequested = isPendingRequest && pendingShiftType && pendingShiftType !== item.shiftType;

                return (
                  <button
                    key={item.dateKey}
                    type="button"
                    onClick={() => openRequestSheet(item)}
                    className={`rounded-xl border p-3 flex items-center gap-3 ${
                      isTodayItem
                        ? "border-primary bg-primary/5"
                        : isRedDate
                          ? "border-error/25 bg-error-container/10"
                          : "border-outline-variant bg-surface-container-lowest"
                    } ${isPendingRequest ? "ring-2 ring-warning" : isFromRequest ? "ring-2 ring-primary/50" : ""} text-left w-full active:scale-[0.99] transition-transform`}
                  >
                    <div className={`w-14 rounded-lg py-2 text-center ${isTodayItem ? "bg-primary text-on-primary" : isRedDate ? "bg-error text-on-error" : "bg-surface-container text-on-surface"}`}>
                      <p className="text-[10px] font-semibold uppercase">{formatDay(item.date)}</p>
                      <p className="text-lg font-bold leading-tight">{item.date.getDate()}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${meta?.pill || "bg-surface-container text-outline"}`}>
                          {meta?.code || "-"}
                        </span>
                        {isTodayItem && (
                          <span className="text-[10px] font-bold text-primary">HARI INI</span>
                        )}
                        {isFromRequest && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isPendingRequest ? "bg-warning text-white" : "bg-primary/10 text-primary"}`}>
                            {isPendingRequest ? showPreviousAndRequested ? `${meta?.code || "-"} → ${shiftMeta[pendingShiftType!].code}` : "MENUNGGU" : "PERMINTAAN"}
                          </span>
                        )}
                        {holiday && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-error-container text-error">
                            TANGGAL MERAH
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-on-surface mt-1">{meta?.label || "Belum diatur"}</h3>
                      <p className="text-xs text-on-surface-variant">{holiday?.name || meta?.time || "Jadwal belum dibuat"}</p>
                      {dayRequest && (
                        <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded text-[10px] font-bold ${requestStatusMeta[dayRequest.status].badge}`}>
                          <span className="material-symbols-outlined text-[14px]">{requestStatusMeta[dayRequest.status].icon}</span>
                          {requestStatusMeta[dayRequest.status].shortLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`material-symbols-outlined text-[22px] ${isWorkShift(item.shiftType) ? "text-primary" : "text-outline"}`}>
                        {meta?.icon || "event_available"}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-outline">edit_calendar</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>
      </main>

      {selectedDay && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Tutup pengajuan"
            onClick={closeRequestSheet}
          />
          <section className="relative w-full rounded-t-2xl bg-surface-container-lowest border-t border-outline-variant p-4 pb-6 shadow-xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-outline-variant" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-outline">Pengajuan tanggal</p>
                <h2 className="text-lg font-bold text-on-surface mt-1">{formatFullDate(selectedDay.date)}</h2>
                <p className="text-sm text-on-surface-variant">
                  Jadwal sekarang: {selectedDay.shiftType ? shiftMeta[selectedDay.shiftType].label : "Belum diatur"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRequestSheet}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {selectedRequest && (
              <div className={`mt-4 rounded-xl border p-3 ${requestStatusMeta[selectedRequest.status].surface}`}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">{requestStatusMeta[selectedRequest.status].icon}</span>
                  <p className="text-sm font-bold">{requestStatusMeta[selectedRequest.status].label}</p>
                </div>
                <p className="text-xs mt-1 opacity-80">
                  {getRequestTypeLabel(selectedRequest)} untuk tanggal ini sudah tercatat.
                </p>
              </div>
            )}

            {selectedRequestLocked ? (
              <button
                type="button"
                onClick={closeRequestSheet}
                className="mt-4 w-full h-12 rounded-xl bg-primary text-on-primary font-bold active:scale-[0.99] transition-transform"
              >
                Mengerti
              </button>
            ) : (
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Jenis pengajuan</span>
                <div className="relative mt-1">
                  <select
                    value={requestType}
                    onChange={(event) => {
                      const value = event.target.value as RequestType;
                      setRequestType(value);
                      if (value === "TUKAR_SHIFT") setSwapDayDate(selectedDay.dateKey);
                      if (value === "TUKAR_HARI" && swapDayDate === selectedDay.dateKey) {
                        const nextDate = new Date(selectedDay.date);
                        nextDate.setDate(nextDate.getDate() + 1);
                        setSwapDayDate(getLocalDateKey(nextDate));
                      }
                    }}
                    className="w-full h-11 rounded-lg border border-outline-variant bg-surface px-3 pr-10 text-sm font-medium outline-none focus:border-primary"
                    disabled={submitStatus === "submitting"}
                  >
                    {requestTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline pointer-events-none">
                    expand_more
                  </span>
                </div>
              </label>

              {isDaySwapRequest && (
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Tanggal tujuan</span>
                  <div className="relative mt-1">
                    <input
                      type="date"
                      value={swapDayDate}
                      onChange={(event) => setSwapDayDate(event.target.value)}
                      className="w-full h-11 rounded-lg border border-outline-variant bg-surface px-3 text-sm font-medium outline-none focus:border-primary"
                      disabled={submitStatus === "submitting"}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Jadwal tanggal ini akan ditukar dengan tanggal yang sedang dipilih setelah approval admin.
                  </p>
                </label>
              )}

              {isEmployeeSwapRequest && (
                <label className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Tukar dengan karyawan</span>
                  <div className="relative mt-1">
                    <select
                      value={swapWithUserId}
                      onChange={(event) => setSwapWithUserId(event.target.value)}
                      className="w-full h-11 rounded-lg border border-outline-variant bg-surface px-3 pr-10 text-sm font-medium outline-none focus:border-primary"
                      disabled={submitStatus === "submitting"}
                    >
                      {employees.length === 0 ? (
                        <option value="">Tidak ada karyawan tersedia</option>
                      ) : employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {employee.nip}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-outline pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Jadwal pada tanggal ini akan langsung ditukar dengan karyawan tujuan.
                  </p>
                </label>
              )}

              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Keterangan</span>
                <textarea
                  value={requestDescription}
                  onChange={(event) => setRequestDescription(event.target.value)}
                  placeholder="Contoh: izin cuti, tukar shift dengan rekan, atau kebutuhan lain."
                  className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-sm outline-none resize-none focus:border-primary"
                  rows={3}
                  disabled={submitStatus === "submitting"}
                />
              </label>

              <button
                type="button"
                onClick={submitRequest}
                disabled={submitStatus === "submitting" || submitStatus === "success"}
                className={`w-full h-12 rounded-xl font-bold active:scale-[0.99] transition-all ${
                  submitStatus === "success"
                    ? "bg-green-600 text-white"
                    : submitStatus === "error"
                      ? "bg-error text-on-error"
                      : "bg-primary text-on-primary"
                }`}
              >
                {submitStatus === "submitting"
                  ? (isEmployeeSwapRequest ? "Memproses tukar..." : "Mengirim...")
                  : submitStatus === "success"
                    ? (isEmployeeSwapRequest ? "Shift berhasil ditukar" : "Pengajuan terkirim")
                    : submitStatus === "error"
                      ? "Gagal, coba lagi"
                      : isEmployeeSwapRequest
                        ? "Tukar Shift Sekarang"
                        : isDaySwapRequest
                          ? "Ajukan Tukar Hari"
                        : "Kirim Pengajuan"}
              </button>
            </div>
            )}
          </section>
        </div>
      )}

      <EmployeeBottomNav />
    </div>
  );
}
