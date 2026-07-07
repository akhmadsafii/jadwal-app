"use client";

import { useEffect, useState, useMemo } from "react";
import {
  AdminStaff,
  ShiftType,
  shiftOptions,
  shiftTypeLabelMap,
  shiftTypeShortLabel,
  gridCellColors,
  gridCellActiveColor,
} from "@/data/adminData";
import { useIndonesiaHolidays } from "@/hooks/useIndonesiaHolidays";

interface ScheduleGridProps {
  staff: AdminStaff[];
  initialDate?: Date;
  initialSchedule?: Record<string, Record<string, ShiftType>>;
  requestScheduleMeta?: Record<string, Record<string, {
    status: "PENDING" | "APPROVED";
    requestId?: string;
    type?: string;
  }>>;
  onMonthChange?: (value: { month: number; year: number }) => void;
  onShiftChange?: (staffId: string, date: Date, shift: ShiftType) => void;
  onBulkShift?: (shift: ShiftType) => void;
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1));
}

const shiftStatisticStyles: Record<ShiftType, string> = {
  PAGI: "border-primary/25 bg-primary/10 text-primary",
  MIDDLE: "border-tertiary/25 bg-tertiary/10 text-tertiary",
  SIANG: "border-tertiary/25 bg-tertiary/10 text-tertiary",
  MALAM: "border-secondary/25 bg-secondary/10 text-secondary",
  LIBUR: "border-outline-variant bg-surface-container-high text-outline",
  CUTI: "border-primary/25 bg-primary/10 text-primary",
  SAKIT: "border-error/25 bg-error-container/70 text-error",
  TURUN: "border-error/25 bg-error/10 text-error",
};

const priorityStatisticShifts: ShiftType[] = ["PAGI", "MIDDLE", "SIANG", "MALAM"];
const secondaryStatisticShifts: ShiftType[] = ["LIBUR", "CUTI", "SAKIT", "TURUN"];

export default function ScheduleGrid({
  staff,
  initialDate = new Date(),
  initialSchedule = {},
  requestScheduleMeta = {},
  onMonthChange,
  onShiftChange,
  onBulkShift,
}: ScheduleGridProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedCell, setSelectedCell] = useState<{
    staffId: string;
    date: Date;
  } | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftType | null>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, Record<string, ShiftType>>>(
    initialSchedule
  );

  useEffect(() => {
    // initialSchedule berasal dari data API/admin page dan perlu menimpa draft lokal saat bulan/data berubah.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSchedule(initialSchedule);
  }, [initialSchedule]);

  useEffect(() => {
    // initialDate berubah saat parent mengganti bulan, jadi state navigasi lokal perlu disinkronkan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentDate(initialDate);
  }, [initialDate]);

  const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);
  const holidays = useIndonesiaHolidays(currentDate.getFullYear());

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    onMonthChange?.({ month: newDate.getMonth() + 1, year: newDate.getFullYear() });
    setSelectedCell(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    onMonthChange?.({ month: today.getMonth() + 1, year: today.getFullYear() });
    setSelectedCell(null);
  };

  const applySelectedShift = (staffId: string, date: Date) => {
    setSelectedCell({ staffId, date });
    if (!selectedShift) return;
    updateShift(staffId, date, selectedShift);
  };

  const handleCellMouseDown = (staffId: string, date: Date) => {
    setIsPainting(true);
    applySelectedShift(staffId, date);
  };

  const handleCellMouseEnter = (staffId: string, date: Date) => {
    if (!isPainting) return;
    applySelectedShift(staffId, date);
  };

  const handleCellTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = element?.closest<HTMLElement>("[data-staff-id][data-date-key]");
    const staffId = cell?.dataset.staffId;
    const dateKey = cell?.dataset.dateKey;
    if (!staffId || !dateKey) return;
    const [cellYear, cellMonth, cellDay] = dateKey.split("-").map(Number);
    applySelectedShift(staffId, new Date(cellYear, cellMonth - 1, cellDay));
  };

  const updateShift = (staffId: string, date: Date, shift: ShiftType) => {
    const dateKey = getDateKey(date);
    setSchedule((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [dateKey]: shift,
      },
    }));
    onShiftChange?.(staffId, date, shift);
  };

  const handleShiftToolSelect = (shift: ShiftType) => {
    setSelectedShift((current) => current === shift ? null : shift);
    if (selectedShift !== shift) onBulkShift?.(shift);
  };

  const fillRowWithShift = (staffId: string, shift: ShiftType | null) => {
    if (!shift) return;
    monthDays.forEach((date) => {
      updateShift(staffId, date, shift);
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getCellClass = (staffId: string, date: Date): string => {
    const dateKey = getDateKey(date);
    const shift = schedule[staffId]?.[dateKey];
    const requestMeta = requestScheduleMeta[staffId]?.[dateKey];
    const isSelected =
      selectedCell?.staffId === staffId &&
      getDateKey(selectedCell.date) === dateKey;

    let baseClass =
      "h-10 flex items-center justify-center text-label-sm font-bold rounded cursor-pointer transition-all border ";
    if (requestMeta?.status === "APPROVED") {
      baseClass += "border-warning bg-warning/10 text-on-surface ring-1 ring-warning/40 ";
    }
    if (requestMeta?.status === "PENDING") {
      baseClass += "border-secondary bg-secondary-container/60 text-on-secondary-container ring-1 ring-secondary/40 ";
      return baseClass;
    }
    if (isSelected) {
      baseClass += gridCellActiveColor + " ";
    }
    if (shift) {
      baseClass += gridCellColors[shift];
    } else {
      baseClass += "border-2 border-dashed border-outline-variant/50 bg-white hover:bg-surface-container-low";
    }
    return baseClass;
  };

  const getCellContent = (staffId: string, date: Date): string => {
    const dateKey = getDateKey(date);
    const shift = schedule[staffId]?.[dateKey];
    if (!shift) return "";
    return shiftTypeShortLabel[shift];
  };

  const calculateMonthlyHours = (staffId: string): number => {
    let hours = 0;
    const staffSchedule = schedule[staffId] || {};
    monthDays.forEach((day) => {
      const shift = staffSchedule[getDateKey(day)];
      if (shift === "PAGI") hours += 7;
      else if (shift === "MIDDLE") hours += 7;
      else if (shift === "SIANG") hours += 7;
      else if (shift === "MALAM") hours += 10; // Night shift is 21:00 - 07:00 = 10 hours
    });
    return hours;
  };

  const calculateShiftCounts = (staffId: string): Record<ShiftType, number> => {
    const counts = shiftOptions.reduce((acc, shift) => {
      acc[shift] = 0;
      return acc;
    }, {} as Record<ShiftType, number>);
    const staffSchedule = schedule[staffId] || {};

    monthDays.forEach((day) => {
      const shift = staffSchedule[getDateKey(day)];
      if (shift) {
        counts[shift] += 1;
      }
    });

    return counts;
  };

  const dailyShiftCounts = useMemo(() => {
    return monthDays.reduce((acc, day) => {
      const dateKey = getDateKey(day);
      acc[dateKey] = shiftOptions.reduce((shiftAcc, shift) => {
        shiftAcc[shift] = 0;
        return shiftAcc;
      }, {} as Record<ShiftType, number>);

      staff.forEach((member) => {
        const shift = schedule[member.id]?.[dateKey];
        if (shift) {
          acc[dateKey][shift] += 1;
        }
      });

      return acc;
    }, {} as Record<string, Record<ShiftType, number>>);
  }, [monthDays, schedule, staff]);

  const monthlyShiftTotals = useMemo(() => {
    return shiftOptions.reduce((acc, shift) => {
      acc[shift] = monthDays.reduce((total, day) => {
        return total + (dailyShiftCounts[getDateKey(day)]?.[shift] || 0);
      }, 0);
      return acc;
    }, {} as Record<ShiftType, number>);
  }, [dailyShiftCounts, monthDays]);

  const getRequestMeta = (staffId: string, date: Date) => {
    return requestScheduleMeta[staffId]?.[getDateKey(date)];
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Week Navigation */}
      <div className="px-container-margin flex items-center justify-between gap-4 py-2">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-surface-container rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            chevron_left
          </span>
        </button>
        <div className="flex items-center gap-3">
          <span className="font-headline-md text-headline-md">
            {formatMonthYear(currentDate)}
          </span>
          {!isToday(currentDate) && (
            <button
              onClick={goToToday}
              className="text-label-sm text-outline border border-outline-variant px-2 py-0.5 rounded hover:bg-surface-container transition-colors"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-surface-container rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            chevron_right
          </span>
        </button>
      </div>

      {/* Quick Assign Toolbar */}
      <div className="sticky top-0 z-30 bg-surface-container-lowest border-y border-outline-variant px-container-margin py-2">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          <span className="text-label-sm font-bold text-primary flex-shrink-0">
            Pilih Shift:
          </span>
          {shiftOptions.map((shift) => (
            <button
              key={shift}
              onClick={() => handleShiftToolSelect(shift)}
              className={`px-3 py-1.5 text-label-sm font-bold rounded-full transition-all flex-shrink-0 ${
                selectedShift === shift
              ? "bg-primary text-on-primary shadow-sm"
                : "bg-white border border-outline-variant hover:bg-surface-container"
              }`}
            >
              {shiftTypeLabelMap[shift]}
            </button>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-on-surface-variant">
              <span>
                {selectedShift ? (
                  <>
                    Mode cepat: klik atau drag sel untuk mengisi <b>{shiftTypeLabelMap[selectedShift]}</b>.
                  </>
                ) : (
                  <b>Pilih shift dulu sebelum klik atau drag sel.</b>
                )}
              </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-1 font-bold text-on-surface">
            <span className="h-2 w-2 rounded-full bg-warning" />
            Approved request
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-1 font-bold text-on-secondary-container">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            Pending request, tampilan saran
          </span>
          {selectedCell && (
            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="rounded-full bg-surface-container px-2 py-1 font-bold text-outline"
            >
              Batal pilih
            </button>
          )}
        </div>
      </div>

      {/* Schedule Grid */}
      <div
        className="overflow-x-auto custom-scrollbar"
        onMouseLeave={() => setIsPainting(false)}
        onMouseUp={() => setIsPainting(false)}
        onTouchEnd={() => setIsPainting(false)}
      >
        <table className="w-full border-collapse bg-white min-w-[1560px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="w-32 max-w-32 sm:w-56 sm:max-w-56 sticky left-0 z-20 bg-surface-container-low p-2 text-left text-label-sm font-bold border-r border-outline-variant">
                <span className="sm:hidden">Staff</span>
                <span className="hidden sm:inline">Staff Member</span>
              </th>
              {monthDays.map((day, idx) => {
                const holiday = holidays.get(getDateKey(day));
                const isRedDate = day.getDay() === 0 || Boolean(holiday);
                return (
                  <th
                    key={idx}
                    className={`min-w-9 sm:min-w-10 p-1 sm:p-2 text-center text-[11px] sm:text-label-sm font-bold border-r border-outline-variant ${
                      isToday(day) ? "bg-primary/5 text-primary" : isRedDate ? "bg-error-container/20 text-error" : ""
                    }`}
                    title={holiday?.name || (day.getDay() === 0 ? "Minggu" : "")}
                  >
                    {day.toLocaleDateString("id-ID", { weekday: "short" })}
                    <br />
                    <span className="font-normal text-[10px]">
                      {day.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </th>
                );
              })}
              {shiftOptions.map((shift) => (
                <th
                  key={shift}
                  className="w-12 p-2 text-center text-[10px] font-bold border-r border-outline-variant bg-surface-container"
                  title={shiftTypeLabelMap[shift]}
                >
                  {shiftTypeShortLabel[shift]}
                </th>
              ))}
              <th className="w-16 p-2 text-center text-label-sm font-bold bg-surface-container">
                Jam
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {staff.map((member) => {
              const totalHours = calculateMonthlyHours(member.id);
              const shiftCounts = calculateShiftCounts(member.id);
              return (
                <tr key={member.id} className="group hover:bg-primary/5">
                  <td className="sticky left-0 z-20 w-32 max-w-32 sm:w-56 sm:max-w-56 bg-white group-hover:bg-primary/5 p-1.5 sm:p-2 border-r border-outline-variant">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="hidden sm:block w-7 h-7 rounded-full overflow-hidden border border-outline-variant flex-shrink-0">
                        <img
                          alt={member.name}
                          src={member.avatarUrl}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="max-w-[76px] sm:max-w-[130px] text-[11px] sm:text-label-sm font-bold truncate">
                          {member.name}
                        </p>
                        <p className="hidden sm:block text-[9px] text-outline">
                          ID: {member.staffId}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fillRowWithShift(member.id, selectedShift)}
                        disabled={!selectedShift}
                        className="ml-auto flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-surface-container text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-surface-container disabled:hover:text-on-surface-variant"
                        title={selectedShift ? `Isi semua tanggal dengan ${shiftTypeLabelMap[selectedShift]}` : "Pilih shift dulu"}
                      >
                        <span className="material-symbols-outlined text-[16px] sm:text-[18px]">format_paint</span>
                      </button>
                    </div>
                  </td>
                  {monthDays.map((day, dayIdx) => {
                    const requestMeta = getRequestMeta(member.id, day);
                    return (
                      <td
                        key={dayIdx}
                        className={`p-0 border-r border-outline-variant cursor-pointer ${
                          isToday(day) ? "bg-primary/[0.02]" : holidays.has(getDateKey(day)) || day.getDay() === 0 ? "bg-error-container/10" : ""
                        }`}
                        title={holidays.get(getDateKey(day))?.name || ""}
                      >
                        <div
                          data-staff-id={member.id}
                          data-date-key={getDateKey(day)}
                          onMouseDown={() => handleCellMouseDown(member.id, day)}
                          onMouseEnter={() => handleCellMouseEnter(member.id, day)}
                          onTouchStart={() => handleCellMouseDown(member.id, day)}
                          onTouchMove={handleCellTouchMove}
                          className={`${getCellClass(member.id, day)} relative group/cell`}
                          title={
                            requestMeta?.status === "APPROVED"
                              ? "Approved request. Admin tetap bisa mengubah jadwal ini."
                              : requestMeta?.status === "PENDING"
                                ? "Pending request pegawai, tampil sebagai saran jadwal"
                                : ""
                          }
                        >
                          <span className="relative">
                            {getCellContent(member.id, day) || "-"}
                            {requestMeta?.status === "APPROVED" && (
                              <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-warning" />
                            )}
                            {requestMeta?.status === "PENDING" && (
                              <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-secondary" />
                            )}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                  {shiftOptions.map((shift) => (
                    <td
                      key={shift}
                      className={`p-2 text-center text-[11px] font-bold border-r border-outline-variant ${shiftCounts[shift] > 0 ? "bg-surface-container-lowest text-on-surface" : "bg-white text-outline/50"}`}
                      title={`${shiftTypeLabelMap[shift]}: ${shiftCounts[shift]} hari`}
                    >
                      {shiftCounts[shift] || "-"}
                    </td>
                  ))}
                  <td className="p-2 text-center text-label-sm font-bold bg-surface-container-lowest">
                    {totalHours > 0 ? `${totalHours}h` : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-outline-variant bg-primary/5">
              <td className="sticky left-0 z-20 w-32 max-w-32 sm:w-56 sm:max-w-56 bg-primary/5 p-2 align-top border-r border-outline-variant">
                <div className="flex items-center gap-1 text-[11px] font-black text-primary">
                  <span className="material-symbols-outlined text-[16px]">monitoring</span>
                  Statistik
                </div>
                <p className="mt-0.5 text-[9px] leading-tight text-on-surface-variant">
                  Per tanggal
                </p>
              </td>
              {monthDays.map((day) => {
                const dateKey = getDateKey(day);
                const totalWorking = priorityStatisticShifts.reduce((total, shift) => {
                  return total + (dailyShiftCounts[dateKey]?.[shift] || 0);
                }, 0);

                return (
                  <td
                    key={`date-stat-${dateKey}`}
                    className={`min-w-9 sm:min-w-10 border-r border-outline-variant p-1 align-top ${
                      isToday(day) ? "bg-primary/10" : holidays.has(dateKey) || day.getDay() === 0 ? "bg-error-container/10" : "bg-white"
                    }`}
                    title={`Total jaga: ${totalWorking} pegawai`}
                  >
                    <div className="mb-1 rounded-md bg-surface-container-low px-1 py-0.5 text-center text-[9px] font-black text-on-surface">
                      {totalWorking} jaga
                    </div>
                    <div className="grid grid-cols-1 gap-0.5">
                      {priorityStatisticShifts.map((shift) => (
                        <div
                          key={`${dateKey}-${shift}`}
                          className={`flex items-center justify-between rounded px-1 py-0.5 text-[9px] font-bold ${shiftStatisticStyles[shift]}`}
                          title={`${shiftTypeLabelMap[shift]}: ${dailyShiftCounts[dateKey]?.[shift] || 0} pegawai`}
                        >
                          <span>{shiftTypeShortLabel[shift]}</span>
                          <span>{dailyShiftCounts[dateKey]?.[shift] || 0}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                      {secondaryStatisticShifts.map((shift) => {
                        const count = dailyShiftCounts[dateKey]?.[shift] || 0;
                        if (count === 0) return null;

                        return (
                          <span
                            key={`${dateKey}-${shift}`}
                            className={`rounded px-1 py-0.5 text-[8px] font-black ${shiftStatisticStyles[shift]}`}
                            title={`${shiftTypeLabelMap[shift]}: ${count} pegawai`}
                          >
                            {shiftTypeShortLabel[shift]} {count}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                );
              })}
              {shiftOptions.map((shift) => (
                <td
                  key={`month-stat-${shift}`}
                  className="border-r border-outline-variant bg-primary/5 p-2 text-center align-middle text-[11px] font-black text-primary"
                  title={`Total ${shiftTypeLabelMap[shift]} bulan ini`}
                >
                  {monthlyShiftTotals[shift] || "-"}
                </td>
              ))}
              <td className="bg-primary/5 p-2 text-center text-[11px] font-bold text-outline">
                -
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
