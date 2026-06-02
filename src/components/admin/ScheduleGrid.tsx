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
  requestLockedSchedule?: Record<string, Record<string, boolean>>;
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

export default function ScheduleGrid({
  staff,
  initialDate = new Date(),
  initialSchedule = {},
  requestLockedSchedule = {},
  onMonthChange,
  onShiftChange,
  onBulkShift,
}: ScheduleGridProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedCell, setSelectedCell] = useState<{
    staffId: string;
    date: Date;
  } | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftType>("PAGI");
  const [isPainting, setIsPainting] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, Record<string, ShiftType>>>(
    initialSchedule
  );

  useEffect(() => {
    setSchedule(initialSchedule);
  }, [initialSchedule]);

  useEffect(() => {
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

  const getShift = (staffId: string, date: Date): ShiftType | null => {
    const dateKey = getDateKey(date);
    return schedule[staffId]?.[dateKey] ?? null;
  };

  const applySelectedShift = (staffId: string, date: Date) => {
    if (requestLockedSchedule[staffId]?.[getDateKey(date)]) return;
    setSelectedCell({ staffId, date });
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
    if (requestLockedSchedule[staffId]?.[dateKey]) return;
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
    setSelectedShift(shift);
    onBulkShift?.(shift);
  };

  const fillRowWithShift = (staffId: string, shift: ShiftType) => {
    monthDays.forEach((date) => {
      if (requestLockedSchedule[staffId]?.[getDateKey(date)]) return;
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
    const isLockedRequest = requestLockedSchedule[staffId]?.[dateKey];
    const isSelected =
      selectedCell?.staffId === staffId &&
      getDateKey(selectedCell.date) === dateKey;

    let baseClass =
      "h-10 flex items-center justify-center text-label-sm font-bold rounded cursor-pointer transition-all border ";
    if (isLockedRequest) {
      return baseClass + "border-warning bg-warning/15 text-on-surface ring-2 ring-warning/70 cursor-not-allowed";
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

  const isRequestLocked = (staffId: string, date: Date) => {
    return Boolean(requestLockedSchedule[staffId]?.[getDateKey(date)]);
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
                Mode cepat: klik atau drag sel untuk mengisi <b>{shiftTypeLabelMap[selectedShift]}</b>.
              </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-1 font-bold text-on-surface">
            <span className="h-2 w-2 rounded-full bg-warning" />
            Dari request pegawai, dikunci
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
                        className="ml-auto flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-surface-container text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors"
                        title={`Isi semua tanggal dengan ${shiftTypeLabelMap[selectedShift]}`}
                      >
                        <span className="material-symbols-outlined text-[16px] sm:text-[18px]">format_paint</span>
                      </button>
                    </div>
                  </td>
                  {monthDays.map((day, dayIdx) => (
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
                        className={getCellClass(member.id, day)}
                        title={isRequestLocked(member.id, day) ? "Dari pengajuan pegawai, tidak bisa diedit dari input admin" : ""}
                      >
                        <span className="relative">
                          {getCellContent(member.id, day) || "-"}
                          {isRequestLocked(member.id, day) && (
                            <span className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-warning" />
                          )}
                        </span>
                      </div>
                    </td>
                  ))}
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
        </table>
      </div>
    </div>
  );
}
