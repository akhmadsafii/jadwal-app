"use client";

import { useState, useEffect } from "react";
import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";
import { useAuth } from "@/lib/authContext";

type ShiftCode = "L" | "P" | "MID" | "S" | "M" | "C" | "X";

interface ShiftAssignment {
  date: string;
  shiftType: string;
}

const monthNames = [
  "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

const dayNames = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];

// Shift type to code mapping
const shiftTypeToCode: Record<string, ShiftCode> = {
  PAGI: "P",
  MIDDLE: "MID",
  SIANG: "S",
  MALAM: "M",
  LIBUR: "L",
  CUTI: "C",
  TURUN: "X",
};

export default function PegawaiRosterPage() {
  const { user, token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState<ShiftAssignment[]>([]);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const monthName = `${monthNames[currentDate.getMonth()]} ${year}`;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  const goToPrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  // Fetch schedule from API
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.id || !token) return;

      try {
        const response = await fetch(
          `/api/schedules?userId=${user.id}&month=${month}&year=${year}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSchedule(data.schedule || []);
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
      }
    };

    fetchSchedule();
  }, [user?.id, token, month, year]);

  const getShiftCode = (day: number): ShiftCode => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const assignment = schedule.find(
      (s) => s.date.split("T")[0] === dateStr
    );

    if (!assignment) return "L";

    return shiftTypeToCode[assignment.shiftType] || "P";
  };

  const getCellClass = (code: string): string => {
    const upperCode = code.toUpperCase();
    switch (upperCode) {
      case "L": return "cell-l";
      case "P": return "cell-p";
      case "S": return "cell-s";
      case "M": return "cell-m";
      case "MID": return "cell-mid";
      case "C": return "cell-c";
      case "X": return "cell-x";
      default: return "cell-p";
    }
  };

  // Calculate shift counts from schedule
  const shiftCounts = schedule.reduce((acc, s) => {
    const code = shiftTypeToCode[s.shiftType] || "P";
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const shiftLegendItems = [
    { code: "P", label: "Pagi", count: shiftCounts.P || 0 },
    { code: "MID", label: "Middle", count: shiftCounts.MID || 0 },
    { code: "S", label: "Siang", count: shiftCounts.S || 0 },
    { code: "M", label: "Malam", count: shiftCounts.M || 0 },
    { code: "L", label: "Libur", count: shiftCounts.L || 0 },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-[140px]">
      <EmployeeTopBar />

      <main className="flex-1 pt-14">
        {/* Month Selector */}
        <section className="bg-surface-container-lowest px-container-margin py-4 border-b border-outline-variant flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-1 rounded-lg"
          >
            chevron_left
          </button>
          <div className="text-center">
            <h1 className="text-headline-md font-semibold text-on-surface">{monthName}</h1>
            <p className="text-label-sm text-outline uppercase tracking-wider">Jadwal Saya</p>
          </div>
          <button
            onClick={goToNextMonth}
            className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-1 rounded-lg"
          >
            chevron_right
          </button>
        </section>

        {/* Schedule Grid */}
        <div className="relative overflow-hidden bg-surface">
          <div className="absolute left-[140px] top-0 bottom-0 w-4 shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.1)] z-10 pointer-events-none" />

          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-surface-container-highest">
                  <th className="sticky left-0 z-30 bg-surface-container-highest min-w-[140px] px-3 py-2 text-left border-r border-outline-variant">
                    <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Nama & NIP</span>
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayOfMonth = i + 1;
                    const dayIndex = (firstDayOfMonth + i) % 7;
                    const dayName = dayNames[dayIndex];
                    const isSunday = dayName === "Mg";
                    return (
                      <th
                        key={dayOfMonth}
                        className={`min-w-[40px] py-2 text-center border-r border-outline-variant ${
                          isSunday ? "bg-error-container/20" : ""
                        }`}
                      >
                        <div className={`text-[10px] ${isSunday ? "text-error" : "text-on-surface-variant"}`}>
                          {dayName}
                        </div>
                        <div className={`text-xs ${isSunday ? "text-error font-bold" : "text-on-surface"}`}>
                          {dayOfMonth}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="sticky left-0 z-20 bg-surface min-w-[140px] px-3 py-2 border-r border-outline-variant">
                    <div className="text-[11px] leading-tight text-on-surface font-bold">{user?.name || "Pegawai"}</div>
                    <div className="text-[9px] text-outline mt-0.5">NIP. {user?.nip || "..."}</div>
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayOfMonth = i + 1;
                    const dayIndex = (firstDayOfMonth + i) % 7;
                    const dayName = dayNames[dayIndex];
                    const isSunday = dayName === "Mg";
                    const shiftCode = getShiftCode(dayOfMonth);

                    return (
                      <td
                        key={dayOfMonth}
                        className={`min-w-[40px] h-10 text-center border-r border-outline-variant text-xs ${getCellClass(
                          shiftCode
                        )} ${isSunday ? "brightness-95" : ""}`}
                      >
                        {shiftCode}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend Section with Counts */}
        <section className="mt-4 px-container-margin">
          <h2 className="text-[10px] text-outline uppercase mb-2 font-semibold">Keterangan Shift ({schedule.length} jadwal)</h2>
          <div className="grid grid-cols-3 gap-2">
            {shiftLegendItems.map((item) => (
              <div key={item.code} className="flex items-center gap-2 bg-surface-container p-2 rounded-lg">
                <span className={`w-6 h-6 flex items-center justify-center ${getCellClass(item.code)} rounded text-[10px] font-bold`}>
                  {item.code}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-on-surface-variant block">{item.label}</span>
                  <span className="text-xs font-bold text-on-surface">{item.count}x</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <EmployeeBottomNav />
    </div>
  );
}