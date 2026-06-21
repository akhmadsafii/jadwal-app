"use client";

import { useEffect, useState } from "react";
import { dayNames, getDaysInMonth } from "@/data/publicData";
import { useIndonesiaHolidays } from "@/hooks/useIndonesiaHolidays";

interface Employee {
  id: string;
  name: string;
  nip: string;
  position: string | null;
  schedule: { date: string; dateKey: string; shiftType: string; pendingShiftType?: string; fromRequest?: boolean; requestStatus?: string }[];
}

interface AdminScheduleGridProps {
  selectedMonth: { month: number; year: number };
  employees?: Employee[];
}

// Map database shift types to short codes
function mapShiftToCode(shiftType: string): string {
  switch (shiftType) {
    case "PAGI":
      return "P";
    case "SIANG":
      return "S";
    case "MALAM":
      return "M";
    case "MIDDLE":
      return "MID";
    case "LIBUR":
      return "L";
    case "CUTI":
      return "C";
    case "SAKIT":
      return "CS";
    case "TURUN":
      return "X";
    default:
      return shiftType.charAt(0);
  }
}

function getCellClass(code: string, fromRequest: boolean = false): string {
  const baseClass = fromRequest ? "ring-2 ring-warning" : "";
  const upperCode = code.toUpperCase();
  switch (upperCode) {
    case "L":
      return fromRequest ? "cell-l cell-request" : "cell-l";
    case "P":
      return fromRequest ? "cell-p cell-request" : "cell-p";
    case "S":
      return fromRequest ? "cell-s cell-request" : "cell-s";
    case "M":
      return fromRequest ? "cell-m cell-request" : "cell-m";
    case "MID":
      return fromRequest ? "cell-mid cell-request" : "cell-mid";
    case "C":
      return fromRequest ? "cell-c cell-request" : "cell-c";
    case "CS":
      return fromRequest ? "cell-cs cell-request" : "cell-cs";
    case "X":
      return fromRequest ? "cell-x cell-request" : "cell-x";
    case "":
      return "cell-empty";
    default:
      return "cell-empty";
  }
}

export default function AdminScheduleGrid({ selectedMonth, employees = [] }: AdminScheduleGridProps) {
  const month = selectedMonth.month;
  const year = selectedMonth.year;
  const actualDaysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const dayNamesStartIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const holidays = useIndonesiaHolidays(year);
  const [todayKey, setTodayKey] = useState("");

  useEffect(() => {
    const today = new Date();
    setTodayKey(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
  }, []);

  // Create a map of schedules for quick lookup
  // Key: "userId-dateKey", Value: roster value plus request status.
  const scheduleMap = new Map<string, { code: string; pendingCode: string; fromRequest: boolean; requestStatus?: string }>();
  employees.forEach((emp) => {
    emp.schedule.forEach((s) => {
      const dayKey = Number(s.dateKey.split("-")[2]);
      scheduleMap.set(`${emp.id}-${dayKey}`, {
        code: mapShiftToCode(s.shiftType),
        pendingCode: s.pendingShiftType ? mapShiftToCode(s.pendingShiftType) : "",
        fromRequest: s.fromRequest || false,
        requestStatus: s.requestStatus,
      });
    });
  });

  return (
    <div className="relative overflow-hidden bg-surface">
      {/* Fixed Shadow Overlay */}
      <div className="absolute left-35 top-0 bottom-0 w-4 shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.1)] z-10 pointer-events-none" />

      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-surface-container-highest">
              <th className="sticky left-0 z-30 bg-surface-container-highest min-w-35 px-3 py-2 text-left border-r border-outline-variant">
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
                const isToday = dateKey === todayKey;

                return (
                  <th
                    key={i + 1}
                    className={`min-w-10 py-2 text-center border-r border-outline-variant ${
                      isToday ? "bg-primary text-on-primary border-x-2 border-primary" : isRedDate ? "bg-error-container/20" : ""
                    }`}
                    title={holiday?.name || (dayName === "Mg" ? "Minggu" : "")}
                  >
                    <div
                      className={`text-[10px] ${
                        isToday ? "text-on-primary" : isRedDate ? "text-error" : "text-on-surface-variant"
                      }`}
                    >
                      {dayName}
                    </div>
                    <div
                      className={`text-xs ${
                        isToday ? "text-on-primary font-bold" : isRedDate ? "text-error font-bold" : "text-on-surface"
                      }`}
                    >
                      {i + 1}
                    </div>
                    {isToday && <div className="text-[7px] font-bold mt-0.5 tracking-wide">HARI INI</div>}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-outline-variant">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  {/* Staff Info */}
                  <td className="sticky left-0 z-20 bg-surface min-w-35 px-3 py-2 border-r border-outline-variant shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                    <div className="text-[11px] leading-tight text-on-surface font-bold">
                      {emp.name}
                    </div>
                    <div className="text-[9px] text-outline mt-0.5">
                      NIP. {emp.nip}
                    </div>
                  </td>

                  {/* Schedule Cells - render based on actual dates */}
                  {Array.from({ length: actualDaysInMonth }, (_, dayIdx) => {
                    const scheduleInfo = scheduleMap.get(`${emp.id}-${dayIdx + 1}`) || { code: "", pendingCode: "", fromRequest: false };
                    const scheduleCode = scheduleInfo.code;
                    const fromRequest = scheduleInfo.fromRequest;
                    const isPending = scheduleInfo.requestStatus === "PENDING";
                    const showPreviousAndRequested = isPending && Boolean(scheduleInfo.pendingCode) && scheduleInfo.pendingCode !== scheduleCode;
                    const dayIndex = (dayNamesStartIndex + dayIdx) % 7;
                    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(dayIdx + 1).padStart(2, "0")}`;
                    const holiday = holidays.get(dateKey);
                    const isRedDate = dayNames[dayIndex] === "Mg" || Boolean(holiday);
                    const isToday = dateKey === todayKey;

                    return (
                      <td
                        key={dayIdx}
                        className={`min-w-10 h-10 text-center border-r border-outline-variant text-xs ${getCellClass(
                          scheduleCode,
                          fromRequest
                        )} ${isToday ? "border-x-2 border-primary ring-2 ring-inset ring-primary shadow-[inset_0_0_0_9999px_rgba(0,83,219,0.16)]" : isRedDate ? "brightness-95 ring-1 ring-inset ring-error/20" : ""}`}
                        title={[holiday?.name, isPending ? "Pengajuan masih menunggu persetujuan" : fromRequest ? "Dari pengajuan pegawai" : ""].filter(Boolean).join(" - ")}
                      >
                        {fromRequest ? <span className="relative">{showPreviousAndRequested ? `${scheduleCode}→${scheduleInfo.pendingCode}` : scheduleCode}<span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${isPending ? "bg-warning" : "bg-primary"}`}></span></span> : scheduleCode}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              // Fallback when no employees data
              <tr>
                <td colSpan={actualDaysInMonth + 1} className="text-center py-8 text-on-surface-variant">
                  Tidak ada data jadwal
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
