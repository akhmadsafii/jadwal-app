"use client";

import { dayNames, getDaysInMonth } from "@/data/publicData";

interface Employee {
  id: string;
  name: string;
  nip: string;
  position: string | null;
  schedule: { date: string; shiftType: string }[];
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
    case "TURUN_JAGA":
      return "X";
    default:
      return shiftType.charAt(0);
  }
}

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

export default function AdminScheduleGrid({ selectedMonth, employees = [] }: AdminScheduleGridProps) {
  const month = selectedMonth.month;
  const year = selectedMonth.year;
  const actualDaysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const dayNamesStartIndex = firstDayOfMonth % 7;

  // Create a map of schedules for quick lookup
  const scheduleMap = new Map<string, string>();
  employees.forEach((emp) => {
    emp.schedule.forEach((s) => {
      const dateObj = new Date(s.date);
      const dayKey = dateObj.getDate();
      scheduleMap.set(`${emp.id}-${dayKey}`, mapShiftToCode(s.shiftType));
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
                const sunday = dayName === "Mg";

                return (
                  <th
                    key={i + 1}
                    className={`min-w-10 py-2 text-center border-r border-outline-variant ${
                      sunday ? "bg-error-container/20" : ""
                    }`}
                  >
                    <div
                      className={`text-[10px] ${
                        sunday ? "text-error" : "text-on-surface-variant"
                      }`}
                    >
                      {dayName}
                    </div>
                    <div
                      className={`text-xs ${
                        sunday ? "text-error font-bold" : "text-on-surface"
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
                    const scheduleCode = scheduleMap.get(`${emp.id}-${dayIdx + 1}`) || "L";
                    const dayIndex = (dayNamesStartIndex + dayIdx) % 7;
                    const isSundayCell = dayNames[dayIndex] === "Mg";

                    return (
                      <td
                        key={dayIdx}
                        className={`min-w-10 h-10 text-center border-r border-outline-variant text-xs ${getCellClass(
                          scheduleCode
                        )} ${isSundayCell ? "brightness-95" : ""}`}
                      >
                        {scheduleCode}
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