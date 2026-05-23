"use client";

import { useState } from "react";
import {
  AdminStaff,
  ShiftType,
  shiftOptions,
  shiftColors,
  shiftAccentClasses,
} from "@/data/adminData";

interface StaffListProps {
  staff: AdminStaff[];
  onShiftChange?: (staffId: string, newShift: ShiftType) => void;
}

export default function StaffList({ staff, onShiftChange }: StaffListProps) {
  const [staffShifts, setStaffShifts] = useState<Record<string, ShiftType>>(
    staff.reduce((acc, s) => ({ ...acc, [s.id]: s.shift }), {})
  );

  const handleShiftChange = (staffId: string, newShift: ShiftType) => {
    setStaffShifts((prev) => ({ ...prev, [staffId]: newShift }));
    onShiftChange?.(staffId, newShift);
  };

  const getToday = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "short",
    };
    return date.toLocaleDateString("id-ID", options);
  };

  return (
    <section className="px-container-margin flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs uppercase tracking-widest text-outline">
          Team Deployment
        </h3>
        <span className="text-xs text-primary font-bold">{getToday()}</span>
      </div>

      {staff.map((member) => {
        const currentShift = staffShifts[member.id] || member.shift;
        return (
          <div
            key={member.id}
            className={`flex items-center gap-3 bg-surface-container-lowest p-2 rounded-lg border border-outline-variant ${
              shiftAccentClasses[currentShift]
            }`}
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
              <img
                alt={member.name}
                className="w-full h-full object-cover"
                src={member.avatarUrl}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-on-surface">
                {member.name}
              </p>
              <p className="text-[10px] text-outline">ID: {member.staffId}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <select
                value={currentShift}
                onChange={(e) =>
                  handleShiftChange(member.id, e.target.value as ShiftType)
                }
                className={`appearance-none bg-surface-container-low border-none text-[10px] font-bold py-1 px-2 rounded pr-6 cursor-pointer focus:ring-1 focus:ring-primary ${shiftColors[currentShift]}`}
              >
                {shiftOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </section>
  );
}