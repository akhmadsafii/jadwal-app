"use client";

import { useCallback, useState } from "react";
import PublicTopBar from "@/components/public/PublicTopBar";
import MonthSelector from "@/components/public/MonthSelector";
import ScheduleGrid from "@/components/public/ScheduleGrid";
import ShiftLegend from "@/components/public/ShiftLegend";
import StatsSection from "@/components/public/StatsSection";
import PublicBottomNav from "@/components/public/PublicBottomNav";

export default function PublicSchedule() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const handleMonthChange = useCallback((month: number, year: number) => {
    setSelectedMonth({ month, year });
  }, []);

  return (
    <div className="min-h-screen pb-[140px]">
      <PublicTopBar />

      <main className="pt-14">
        <MonthSelector onMonthChange={handleMonthChange} />
        <ScheduleGrid selectedMonth={selectedMonth} />
        <ShiftLegend />
        <StatsSection selectedMonth={selectedMonth} />
      </main>

      {/* FAB */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-40">
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>

      <PublicBottomNav />
    </div>
  );
}
