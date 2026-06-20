"use client";

import { useState, useCallback, useEffect } from "react";
import PublicTopBar from "@/components/public/PublicTopBar";
import MonthSelector from "@/components/public/MonthSelector";
import ScheduleGrid from "@/components/public/ScheduleGrid";
import ShiftLegend from "@/components/public/ShiftLegend";
import { getDaysInMonth } from "@/data/publicData";

interface ScheduleResponse {
  employees: {
    id: string;
    name: string;
    nip: string;
    schedule: { date: string; shiftType: string }[];
  }[];
  monthlyStats: {
    totalWorkDays: number;
    attendanceRate: number;
    overtimeHours: number;
  };
  shiftCounts: Record<string, number>;
}

const workingShiftTypes = new Set(["PAGI", "MIDDLE", "SIANG", "MALAM"]);

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(selectedMonth.year, selectedMonth.month);
  const monthlyStats = scheduleData?.monthlyStats;
  const shiftCounts = scheduleData?.shiftCounts || {};
  const totalStaff = scheduleData?.employees.length || 0;
  const activeStaff = scheduleData?.employees.filter((employee) =>
    employee.schedule.some((assignment) => workingShiftTypes.has(assignment.shiftType))
  ).length || 0;

  const handleMonthChange = useCallback((month: number, year: number) => {
    setSelectedMonth({ month, year });
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      setScheduleError(null);
      try {
        const response = await fetch(
          `/api/schedules?month=${selectedMonth.month}&year=${selectedMonth.year}`,
          { cache: "no-store" }
        );
        if (!response.ok) {
          throw new Error(`Server mengembalikan status ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data?.employees)) {
          throw new Error("Format data jadwal tidak valid");
        }
        setScheduleData(data);
      } catch (error) {
        console.error("Gagal memuat jadwal publik:", error);
        setScheduleData(null);
        setScheduleError("Jadwal belum dapat dimuat. Periksa koneksi internet lalu muat ulang halaman.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedMonth.month, selectedMonth.year]);

  return (
    <div className="min-h-screen">
      <PublicTopBar />

      <main>
        <MonthSelector onMonthChange={handleMonthChange} />
        <ScheduleGrid
          daysInMonth={daysInMonth}
          selectedMonth={selectedMonth}
          employees={scheduleData?.employees || []}
          isLoading={isLoading}
          errorMessage={scheduleError}
        />

        {/* Monthly Shift Statistics */}
        <section className="px-container-margin py-4">
          <h2 className="text-sm font-semibold text-on-surface-variant mb-3">Statistik Shift Bulan Ini</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-primary text-[18px]">wb_sunny</span>
              </div>
              <p className="text-lg font-bold text-primary">{shiftCounts.PAGI || 0}</p>
              <p className="text-[10px] text-on-surface-variant">Pagi</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto bg-tertiary/10 rounded-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]">schedule</span>
              </div>
              <p className="text-lg font-bold text-tertiary">{shiftCounts.MIDDLE || 0}</p>
              <p className="text-[10px] text-on-surface-variant">Middle</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto bg-tertiary/10 rounded-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]">light_mode</span>
              </div>
              <p className="text-lg font-bold text-tertiary">{shiftCounts.SIANG || 0}</p>
              <p className="text-[10px] text-on-surface-variant">Siang</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto bg-secondary/10 rounded-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">nightlight</span>
              </div>
              <p className="text-lg font-bold text-secondary">{shiftCounts.MALAM || 0}</p>
              <p className="text-[10px] text-on-surface-variant">Malam</p>
            </div>
          </div>
        </section>

        {/* Monthly Summary */}
        <section className="px-container-margin py-4">
          <h2 className="text-sm font-semibold text-on-surface-variant mb-3">Ringkasan Bulan {selectedMonth.month}/{selectedMonth.year}</h2>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="p-4 border-r border-b border-outline-variant">
                <p className="text-[10px] text-on-surface-variant uppercase">Total Hari Dinas</p>
                <p className="text-xl font-bold text-on-surface">{monthlyStats?.totalWorkDays || 0} Hari</p>
              </div>
              <div className="p-4 border-b border-outline-variant">
                <p className="text-[10px] text-on-surface-variant uppercase">Kehadiran</p>
                <p className="text-xl font-bold text-on-surface">{monthlyStats?.attendanceRate || 0}%</p>
              </div>
              <div className="p-4 border-r border-outline-variant">
                <p className="text-[10px] text-on-surface-variant uppercase">Staff Berdinas</p>
                <p className="text-xl font-bold text-on-surface">{activeStaff} Org</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-on-surface-variant uppercase">Total Staff</p>
                <p className="text-xl font-bold text-on-surface">{totalStaff} Org</p>
              </div>
            </div>
          </div>
        </section>

        <ShiftLegend />
      </main>
    </div>
  );
}
