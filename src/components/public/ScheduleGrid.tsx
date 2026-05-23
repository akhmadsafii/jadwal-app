"use client";

import { staffData, dayNames } from "@/data/publicData";

interface ScheduleGridProps {
  daysInMonth?: number;
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
    default:
      return "cell-p";
  }
}

function isSunday(index: number): boolean {
  return (index + 1) % 7 === 3;
}

export default function ScheduleGrid({ daysInMonth = 31 }: ScheduleGridProps) {
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
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayIndex = i + 1;
                const dayName = dayNames[dayIndex % 7];
                const sunday = dayName === "Mg";
                return (
                  <th
                    key={dayIndex}
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
                      {dayIndex}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-outline-variant">
            {staffData.map((staff) => (
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
                {staff.schedule.map((code, idx) => (
                  <td
                    key={idx}
                    className={`min-w-[40px] h-10 text-center border-r border-outline-variant text-xs ${getCellClass(
                      code
                    )} ${isSunday(idx) ? "brightness-95" : ""}`}
                  >
                    {code}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}