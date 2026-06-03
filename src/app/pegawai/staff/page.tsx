"use client";

import { useEffect, useMemo, useState } from "react";
import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";
import ScheduleGrid from "@/components/public/ScheduleGrid";
import ShiftLegend from "@/components/public/ShiftLegend";
import { useAuth } from "@/lib/authContext";
import { getDateKeyFromApi, getLocalDateKey } from "@/lib/dateKeys";

type ShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";
type ShiftFilter = ShiftType | "ALL";
type ViewMode = "DAILY" | "CALENDAR";

interface ShiftAssignment {
  date: string;
  dateKey?: string;
  shiftType: ShiftType;
}

interface EmployeeSchedule {
  id: string;
  name: string;
  nip: string;
  position?: string | null;
  avatarUrl?: string | null;
  schedule: ShiftAssignment[];
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
  chip: string;
  surface: string;
}> = {
  PAGI: {
    code: "P",
    label: "Pagi",
    time: "07:00 - 14:00",
    icon: "wb_sunny",
    chip: "bg-primary text-on-primary",
    surface: "bg-primary/10 border-primary/20 text-primary",
  },
  MIDDLE: {
    code: "MID",
    label: "Middle",
    time: "10:00 - 17:00",
    icon: "schedule",
    chip: "bg-tertiary text-on-tertiary",
    surface: "bg-tertiary/10 border-tertiary/20 text-tertiary",
  },
  SIANG: {
    code: "S",
    label: "Siang",
    time: "14:00 - 21:00",
    icon: "light_mode",
    chip: "bg-tertiary text-on-tertiary",
    surface: "bg-tertiary/10 border-tertiary/20 text-tertiary",
  },
  MALAM: {
    code: "M",
    label: "Malam",
    time: "21:00 - 07:00",
    icon: "nightlight",
    chip: "bg-secondary text-on-secondary",
    surface: "bg-secondary/10 border-secondary/20 text-secondary",
  },
  LIBUR: {
    code: "L",
    label: "Libur",
    time: "Tidak bertugas",
    icon: "weekend",
    chip: "bg-surface-container-highest text-on-surface-variant",
    surface: "bg-surface-container border-outline-variant text-on-surface-variant",
  },
  CUTI: {
    code: "C",
    label: "Cuti",
    time: "Cuti",
    icon: "beach_access",
    chip: "bg-primary-container text-on-primary-container",
    surface: "bg-primary/10 border-primary/20 text-primary",
  },
  SAKIT: {
    code: "CS",
    label: "Cuti Sakit",
    time: "Izin / sakit",
    icon: "medical_services",
    chip: "bg-error text-on-error",
    surface: "bg-error-container border-error/20 text-on-error-container",
  },
  TURUN: {
    code: "X",
    label: "Turun",
    time: "Turun jaga",
    icon: "event_busy",
    chip: "bg-error text-on-error",
    surface: "bg-error-container border-error/20 text-on-error-container",
  },
};

const shiftFilters: { key: ShiftFilter; label: string; icon: string }[] = [
  { key: "ALL", label: "Semua", icon: "groups" },
  { key: "PAGI", label: "Pagi", icon: "wb_sunny" },
  { key: "MIDDLE", label: "Middle", icon: "schedule" },
  { key: "SIANG", label: "Siang", icon: "light_mode" },
  { key: "MALAM", label: "Malam", icon: "nightlight" },
  { key: "LIBUR", label: "Libur", icon: "weekend" },
];

function getDateKey(date: Date) {
  return getLocalDateKey(date);
}

function getShiftForDate(employee: EmployeeSchedule, dateKey: string): ShiftType {
  const assignment = employee.schedule.find((item) => (item.dateKey || getDateKeyFromApi(item.date)) === dateKey);
  return assignment?.shiftType || "LIBUR";
}

function formatDateLong(date: Date) {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function PegawaiStaffPage() {
  const { user, token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(getDateKey(new Date()));
  const [employees, setEmployees] = useState<EmployeeSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ShiftFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("DAILY");

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const monthLabel = `${monthNames[currentDate.getMonth()]} ${year}`;

  const monthDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(year, month - 1, index + 1);
      return {
        date,
        dateKey: getDateKey(date),
        dayNumber: index + 1,
        dayName: date.toLocaleDateString("id-ID", { weekday: "short" }),
      };
    });
  }, [month, year]);

  const selectedDate = useMemo(() => {
    const [selectedYear, selectedMonth, selectedDay] = selectedDateKey.split("-").map(Number);
    return new Date(selectedYear, selectedMonth - 1, selectedDay);
  }, [selectedDateKey]);

  const employeesWithShift = useMemo(() => {
    return employees.map((employee) => ({
      ...employee,
      shiftType: getShiftForDate(employee, selectedDateKey),
      isCurrentUser: employee.id === user?.id,
    }));
  }, [employees, selectedDateKey, user?.id]);

  const shiftCounts = useMemo(() => {
    return employeesWithShift.reduce(
      (acc, employee) => {
        acc[employee.shiftType] += 1;
        return acc;
      },
      { PAGI: 0, MIDDLE: 0, SIANG: 0, MALAM: 0, LIBUR: 0, CUTI: 0, SAKIT: 0, TURUN: 0 } as Record<ShiftType, number>
    );
  }, [employeesWithShift]);

  const filteredEmployees = employeesWithShift.filter((employee) => {
    if (activeFilter === "ALL") return true;
    return employee.shiftType === activeFilter;
  });

  const workingCount = shiftCounts.PAGI + shiftCounts.MIDDLE + shiftCounts.SIANG + shiftCounts.MALAM;

  const goToPrevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      setSelectedDateKey(getDateKey(next));
      return next;
    });
    setActiveFilter("ALL");
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      setSelectedDateKey(getDateKey(next));
      return next;
    });
    setActiveFilter("ALL");
  };

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/schedules?month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setEmployees(data.employees || []);
        }
      } catch (error) {
        console.error("Failed to fetch staff schedules:", error);
        setEmployees([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, [token, month, year]);

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
              <p className="text-[10px] uppercase tracking-wider text-outline">Jadwal Semua Pegawai</p>
              <h1 className="text-lg font-bold text-on-surface">{monthLabel}</h1>
            </div>
            <button
              onClick={goToNextMonth}
              className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Bulan berikutnya"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-surface-container p-1">
            <button
              type="button"
              onClick={() => setViewMode("DAILY")}
              className={`h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${
                viewMode === "DAILY"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">view_day</span>
              Harian
            </button>
            <button
              type="button"
              onClick={() => setViewMode("CALENDAR")}
              className={`h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${
                viewMode === "CALENDAR"
                  ? "bg-primary text-on-primary shadow-sm"
                  : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">calendar_view_month</span>
              Kalender
            </button>
          </div>
        </section>

        {viewMode === "CALENDAR" ? (
          <section className="py-4 space-y-4">
            <div className="px-container-margin">
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                    <span className="material-symbols-outlined">calendar_view_month</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-on-surface">Mode kalender bulanan</p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Tampilan seperti public roster, tetapi tetap di dalam akses pegawai.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <ScheduleGrid
              selectedMonth={{ month, year }}
              employees={employees}
              isLoading={isLoading}
            />
            <ShiftLegend />
          </section>
        ) : (
        <>
        <section className="px-container-margin py-4 space-y-3">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {monthDays.map((day) => {
              const isSelected = day.dateKey === selectedDateKey;
              const isToday = day.dateKey === getDateKey(new Date());
              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => {
                    setSelectedDateKey(day.dateKey);
                    setActiveFilter("ALL");
                  }}
                  className={`flex-none w-14 rounded-xl border py-2 text-center active:scale-95 transition-all ${
                    isSelected
                      ? "bg-primary text-on-primary border-primary"
                      : "bg-surface-container-lowest text-on-surface border-outline-variant"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase">{day.dayName}</p>
                  <p className="text-lg font-bold leading-tight">{day.dayNumber}</p>
                  {isToday && <p className={`text-[9px] font-bold mt-0.5 ${isSelected ? "text-on-primary" : "text-primary"}`}>Hari ini</p>}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-outline">Dipilih</p>
                <h2 className="text-lg font-bold text-on-surface mt-1">{formatDateLong(selectedDate)}</h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  {workingCount} dinas, {shiftCounts.LIBUR + shiftCounts.CUTI + shiftCounts.SAKIT + shiftCounts.TURUN} tidak dinas
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined">groups</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(["PAGI", "MIDDLE", "SIANG", "MALAM"] as ShiftType[]).map((shiftType) => (
              <button
                key={shiftType}
                type="button"
                onClick={() => setActiveFilter(shiftType)}
                className={`rounded-lg border p-2 text-center ${
                  activeFilter === shiftType ? shiftMeta[shiftType].surface : "bg-surface-container-lowest border-outline-variant"
                }`}
              >
                <p className="text-base font-bold">{shiftCounts[shiftType]}</p>
                <p className="text-[10px] text-on-surface-variant">{shiftMeta[shiftType].label}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="px-container-margin pb-4">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {shiftFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
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
                <div key={index} className="h-[78px] rounded-xl bg-surface-container animate-pulse" />
              ))
            ) : filteredEmployees.length === 0 ? (
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center">
                <span className="material-symbols-outlined text-[40px] text-outline">event_busy</span>
                <p className="mt-2 text-sm text-on-surface-variant">Tidak ada pegawai pada filter ini</p>
              </div>
            ) : (
              filteredEmployees.map((employee) => {
                const meta = shiftMeta[employee.shiftType];
                return (
                  <article
                    key={employee.id}
                    className={`rounded-xl border p-3 flex items-center gap-3 ${
                      employee.isCurrentUser
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant bg-surface-container-lowest"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-surface-container flex-shrink-0">
                      {employee.avatarUrl ? (
                        <img src={employee.avatarUrl} alt={employee.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[22px] text-on-surface-variant">person</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-on-surface truncate">{employee.name}</h3>
                        {employee.isCurrentUser && (
                          <span className="flex-none text-[10px] font-bold text-primary">SAYA</span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">{employee.position || "Pegawai"}</p>
                      <p className="text-[10px] text-outline mt-0.5">{meta.time}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${meta.chip}`}>{meta.code}</span>
                      <span className="material-symbols-outlined text-[20px] text-outline">{meta.icon}</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
        </>
        )}
      </main>

      <EmployeeBottomNav />
    </div>
  );
}
