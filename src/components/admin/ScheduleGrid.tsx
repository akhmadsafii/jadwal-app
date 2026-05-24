"use client";

import { useState, useMemo } from "react";
import {
  AdminStaff,
  ShiftType,
  shiftOptions,
  shiftTypeLabelMap,
  shiftTypeShortLabel,
  gridCellColors,
  gridCellActiveColor,
  getWeekDays,
  formatDate,
} from "@/data/adminData";

interface ScheduleGridProps {
  staff: AdminStaff[];
  initialDate?: Date;
  onShiftChange?: (staffId: string, date: Date, shift: ShiftType) => void;
  onBulkShift?: (shift: ShiftType) => void;
}

export default function ScheduleGrid({
  staff,
  initialDate = new Date(),
  onShiftChange,
  onBulkShift,
}: ScheduleGridProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedCell, setSelectedCell] = useState<{
    staffId: string;
    date: Date;
  } | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftType>("PAGI");
  const [schedule, setSchedule] = useState<Record<string, Record<string, ShiftType>>>(
    {}
  );

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
    setSelectedCell(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedCell(null);
  };

  const getShift = (staffId: string, date: Date): ShiftType | null => {
    const dateKey = date.toISOString().split("T")[0];
    return schedule[staffId]?.[dateKey] ?? null;
  };

  const handleCellClick = (staffId: string, date: Date) => {
    setSelectedCell({ staffId, date });
    const dateKey = date.toISOString().split("T")[0];
    const currentShift = schedule[staffId]?.[dateKey];

    if (currentShift) {
      // Cycle through shifts
      const currentIndex = shiftOptions.indexOf(currentShift);
      const nextIndex = (currentIndex + 1) % shiftOptions.length;
      const newShift = shiftOptions[nextIndex];
      updateShift(staffId, date, newShift);
    } else {
      // Set default shift
      updateShift(staffId, date, "PAGI");
    }
  };

  const updateShift = (staffId: string, date: Date, shift: ShiftType) => {
    const dateKey = date.toISOString().split("T")[0];
    setSchedule((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [dateKey]: shift,
      },
    }));
    onShiftChange?.(staffId, date, shift);
  };

  const handleBulkAssign = (shift: ShiftType) => {
    if (!selectedCell) return;
    updateShift(selectedCell.staffId, selectedCell.date, shift);
    setSelectedShift(shift);
    onBulkShift?.(shift);
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
    const dateKey = date.toISOString().split("T")[0];
    const shift = schedule[staffId]?.[dateKey];
    const isSelected =
      selectedCell?.staffId === staffId &&
      selectedCell?.date.toISOString().split("T")[0] === dateKey;

    let baseClass =
      "h-10 flex items-center justify-center text-label-sm font-bold rounded cursor-pointer transition-all border ";
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
    const dateKey = date.toISOString().split("T")[0];
    const shift = schedule[staffId]?.[dateKey];
    if (!shift) return "";
    return shiftTypeShortLabel[shift];
  };

  const calculateWeeklyHours = (staffId: string): number => {
    let hours = 0;
    const staffSchedule = schedule[staffId] || {};
    Object.values(staffSchedule).forEach((shift) => {
      if (shift === "PAGI") hours += 7;
      else if (shift === "MIDDLE") hours += 7;
      else if (shift === "SIANG") hours += 7;
      else if (shift === "MALAM") hours += 10; // Night shift is 21:00 - 07:00 = 10 hours
    });
    return hours;
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
          onClick={() => navigateWeek(-1)}
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
          onClick={() => navigateWeek(1)}
          className="p-2 hover:bg-surface-container rounded-full transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            chevron_right
          </span>
        </button>
      </div>

      {/* Quick Assign Toolbar */}
      {selectedCell && (
        <div className="sticky top-0 z-30 bg-primary/5 border-y border-primary/20 px-container-margin py-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3">
            <span className="text-label-sm font-bold text-primary flex-shrink-0">
              QUICK ASSIGN:
            </span>
            <div className="flex gap-1.5">
              {shiftOptions.map((shift) => (
                <button
                  key={shift}
                  onClick={() => handleBulkAssign(shift)}
                  className={`px-3 py-1 text-label-sm font-bold rounded-full transition-all ${
                    selectedShift === shift
                      ? "bg-primary text-on-primary"
                      : "bg-white border border-outline-variant hover:bg-surface-container"
                  }`}
                >
                  {shiftTypeLabelMap[shift]}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setSelectedCell(null)}
              className="p-1 text-on-surface-variant hover:bg-surface-container rounded-full"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse bg-white min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="w-48 sticky left-0 z-20 bg-surface-container-low p-2 text-left text-label-sm font-bold border-r border-outline-variant">
                Staff Member
              </th>
              {weekDays.map((day, idx) => (
                <th
                  key={idx}
                  className={`p-2 text-center text-label-sm font-bold border-r border-outline-variant ${
                    isToday(day) ? "bg-primary/5 text-primary" : ""
                  }`}
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
              ))}
              <th className="w-16 p-2 text-center text-label-sm font-bold">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {staff.map((member) => {
              const totalHours = calculateWeeklyHours(member.id);
              return (
                <tr key={member.id} className="group hover:bg-primary/5">
                  <td className="sticky left-0 z-20 bg-white group-hover:bg-primary/5 p-2 border-r border-outline-variant">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-outline-variant flex-shrink-0">
                        <img
                          alt={member.name}
                          src={member.avatarUrl}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-label-sm font-bold truncate">
                          {member.name}
                        </p>
                        <p className="text-[9px] text-outline">
                          ID: {member.staffId}
                        </p>
                      </div>
                    </div>
                  </td>
                  {weekDays.map((day, dayIdx) => (
                    <td
                      key={dayIdx}
                      className={`p-0 border-r border-outline-variant cursor-pointer ${
                        isToday(day) ? "bg-primary/[0.02]" : ""
                      }`}
                    >
                      <div
                        onClick={() => handleCellClick(member.id, day)}
                        className={getCellClass(member.id, day)}
                      >
                        {getCellContent(member.id, day)}
                      </div>
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