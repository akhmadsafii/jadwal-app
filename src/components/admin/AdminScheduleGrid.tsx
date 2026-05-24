"use client";

import { Staff, dayNames, generateScheduleForMonth, getDaysInMonth } from "@/data/publicData";

interface AdminScheduleGridProps {
  staff: Staff[];
  selectedMonth: { month: number; year: number };
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

function isSundayHeader(dayIndex: number): boolean {
  return dayNames[dayIndex % 7] === "Mg";
}

export default function AdminScheduleGrid({ staff, selectedMonth }: AdminScheduleGridProps) {
  const month = selectedMonth.month;
  const year = selectedMonth.year;
  const actualDaysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const dayNamesStartIndex = firstDayOfMonth % 7;

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
                const sunday = dayName === "Mg";

                return (
                  <th
                    key={i + 1}
                    className={`min-w-[40px] py-2 text-center border-r border-outline-variant ${
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
            {staff.map((s) => {
              const schedule = generateScheduleForMonth(s.id, year, month);

              return (
                <tr
                  key={s.id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  {/* Staff Info */}
                  <td className="sticky left-0 z-20 bg-surface min-w-[140px] px-3 py-2 border-r border-outline-variant shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                    <div className="text-[11px] leading-tight text-on-surface font-bold">
                      {s.name}
                    </div>
                    <div className="text-[9px] text-outline mt-0.5">
                      NIP. {s.nip}
                    </div>
                  </td>

                  {/* Schedule Cells */}
                  {schedule.map((code, idx) => {
                    const dayIndex = (dayNamesStartIndex + idx) % 7;
                    const isSundayCell = dayNames[dayIndex] === "Mg";

                    return (
                      <td
                        key={idx}
                        className={`min-w-[40px] h-10 text-center border-r border-outline-variant text-xs ${getCellClass(
                          code
                        )} ${isSundayCell ? "brightness-95" : ""}`}
                      >
                        {code}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}