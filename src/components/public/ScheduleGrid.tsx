"use client";

import { useEffect, useState } from "react";
import { dayNames, getDaysInMonth } from "@/data/publicData";
import { useIndonesiaHolidays } from "@/hooks/useIndonesiaHolidays";

interface ScheduleGridProps {
  daysInMonth?: number;
  selectedMonth?: { month: number; year: number };
  employees?: PublicScheduleEmployee[];
  isLoading?: boolean;
}

interface PublicScheduleEmployee {
  id: string;
  name: string;
  nip: string;
  schedule: { date: string; shiftType: string }[];
}

const shiftTypeToCode: Record<string, string> = {
  PAGI: "P",
  MIDDLE: "MID",
  SIANG: "S",
  MALAM: "M",
  LIBUR: "L",
  CUTI: "C",
  TURUN: "X",
};

function getCellClass(code: string): string {
  const upperCode = code.toUpperCase();
  switch (upperCode) {
    case "L":
      return "cell-l";
    case "P":
      return "cell-p";
    case "S":
      return "cell-s";
    case "M":
      return "cell-m";
    case "MID":
      return "cell-mid";
    case "C":
      return "cell-c";
    case "X":
      return "cell-x";
    default:
      return "cell-p";
  }
}

function isSunday(index: number): boolean {
  // Check if the day index falls on Sunday
  // dayIndex 0 is day 1 of month, we need to find what day of week it is
  return (index % 7) === 6; // Sunday is index 6 in 0-based (0=Mon, 6=Sun)
}

function getDayName(dayIndex: number): string {
  // dayIndex is 0-based, we calculate the actual day of week
  // based on the first day of the selected month
  return dayNames[dayIndex % 7];
}

function isSundayHeader(dayIndex: number): boolean {
  return dayNames[dayIndex % 7] === "Mg";
}

export default function ScheduleGrid({
  daysInMonth = 31,
  selectedMonth,
  employees,
  isLoading = false,
}: ScheduleGridProps) {
  // Get actual month and year
  const month = selectedMonth?.month || new Date().getMonth() + 1;
  const year = selectedMonth?.year || new Date().getFullYear();
  const [fetchedEmployees, setFetchedEmployees] = useState<PublicScheduleEmployee[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Get actual days in month if selectedMonth is provided
  const actualDaysInMonth = selectedMonth
    ? getDaysInMonth(year, month)
    : daysInMonth;

  // Get first day of month to align correctly
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const dayNamesStartIndex = firstDayOfMonth % 7; // 0=Sun in JS, convert to our index
  const visibleEmployees = employees ?? fetchedEmployees;
  const loading = isLoading || isFetching;
  const holidays = useIndonesiaHolidays(year);

  useEffect(() => {
    if (employees) return;

    setIsFetching(true);
    fetch(`/api/schedules?month=${month}&year=${year}`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setFetchedEmployees(data?.employees || []))
      .catch(() => setFetchedEmployees([]))
      .finally(() => setIsFetching(false));
  }, [employees, month, year]);

  return (
    <div className="relative overflow-hidden bg-surface">
      {/* Fixed Shadow Overlay */}
      <div className="absolute left-[140px] top-0 bottom-0 w-4 shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.1)] z-10 pointer-events-none" />

      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-surface-container-highest">
              <th className="sticky left-0 z-30 bg-surface-container-highest min-w-[140px] px-3 py-2 text-left border-r border-outline-variant">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">
                  Staff Name & NIP
                </span>
              </th>
              {Array.from({ length: actualDaysInMonth }, (_, i) => {
                const dayIndex = (dayNamesStartIndex + i) % 7;
                const dayName = dayNames[dayIndex];
                const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
                const holiday = holidays.get(dateKey);
                const isRedDate = dayName === "Mg" || Boolean(holiday);

                return (
                  <th
                    key={i + 1}
                    className={`min-w-[40px] py-2 text-center border-r border-outline-variant ${
                      isRedDate ? "bg-error-container/20" : ""
                    }`}
                    title={holiday?.name || (dayName === "Mg" ? "Minggu" : "")}
                  >
                    <div
                      className={`text-[10px] ${
                        isRedDate ? "text-error" : "text-on-surface-variant"
                      }`}
                    >
                      {dayName}
                    </div>
                    <div
                      className={`text-xs ${
                        isRedDate ? "text-error font-bold" : "text-on-surface"
                      }`}
                    >
                      {i + 1}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-outline-variant">
            {loading ? (
              <tr>
                <td colSpan={actualDaysInMonth + 1} className="py-10 text-center text-sm text-outline">
                  Memuat jadwal...
                </td>
              </tr>
            ) : visibleEmployees.length === 0 ? (
              <tr>
                <td colSpan={actualDaysInMonth + 1} className="py-10 text-center text-sm text-outline">
                  Belum ada data jadwal di database
                </td>
              </tr>
            ) : (
              visibleEmployees.map((staff) => {
                const scheduleByDay = new Map(
                  staff.schedule.map((assignment) => [
                    new Date(assignment.date).getDate(),
                    shiftTypeToCode[assignment.shiftType] || "L",
                  ])
                );

                return (
                <tr
                  key={staff.id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  {/* Staff Info */}
                  <td className="sticky left-0 z-20 bg-surface min-w-[140px] px-3 py-2 border-r border-outline-variant shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                    <div className="text-[11px] leading-tight text-on-surface font-bold">
                      {staff.name}
                    </div>
                    <div className="text-[9px] text-outline mt-0.5">
                      NIP. {staff.nip}
                    </div>
                  </td>

                  {/* Schedule Cells */}
                  {Array.from({ length: actualDaysInMonth }, (_, idx) => {
                    const code = scheduleByDay.get(idx + 1) || "L";
                    const dayIndex = (dayNamesStartIndex + idx) % 7;
                    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(idx + 1).padStart(2, "0")}`;
                    const holiday = holidays.get(dateKey);
                    const isRedDate = dayNames[dayIndex] === "Mg" || Boolean(holiday);

                    return (
                      <td
                        key={idx}
                        className={`min-w-[40px] h-10 text-center border-r border-outline-variant text-xs ${getCellClass(
                          code
                        )} ${isRedDate ? "brightness-95 ring-1 ring-inset ring-error/20" : ""}`}
                        title={holiday?.name || ""}
                      >
                        {code}
                      </td>
                    );
                  })}
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
