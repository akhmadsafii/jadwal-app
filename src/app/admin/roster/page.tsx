"use client";

import { useState, useEffect, useRef } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import MonthSelector from "@/components/public/MonthSelector";
import AdminScheduleGrid from "@/components/admin/AdminScheduleGrid";
import ShiftLegend from "@/components/public/ShiftLegend";
import ExportButton from "@/components/admin/ExportButton";
import { getDaysInMonth } from "@/data/publicData";

interface Employee {
  id: string;
  name: string;
  nip: string;
  position: string | null;
  schedule: { date: string; shiftType: string }[];
}

interface ScheduleData {
  employees: Employee[];
  monthlyStats: {
    month: number;
    year: number;
    totalWorkDays: number;
    attendanceRate: number;
    overtimeHours: number;
  };
}

export default function AdminRosterPage() {
  const now = new Date();
  const initialMonth = now.getMonth() + 1;
  const initialYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef(false);

  const fetchScheduleData = async (month: number, year: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/schedules?month=${month}&year=${year}`);
      const data = await response.json();
      if (data.success) {
        setScheduleData(data);
      }
    } catch (error) {
      console.error("Error fetching schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    fetchScheduleData(month, year);
  };

  // Initial fetch - using ref to prevent double call
  useEffect(() => {
    if (!fetchRef.current) {
      fetchRef.current = true;
      fetchScheduleData(initialMonth, initialYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const employees = scheduleData?.employees || [];
  const monthlyStats = scheduleData?.monthlyStats;

  const onDuty = employees.length;

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <AdminTopBar />

      <main className="flex-1 w-full flex flex-col gap-4 py-4 overflow-x-hidden">
        {/* Header with Export Button */}
        <div className="px-container-margin flex items-center justify-between">
          <h1 className="text-lg font-semibold text-on-surface">Jadwal Semua Pegawai</h1>
          <ExportButton
            month={selectedMonth}
            year={selectedYear}
          />
        </div>

        {/* Month Selector */}
        <div className="px-container-margin">
          <MonthSelector
            onMonthChange={handleMonthChange}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </div>

        {/* Schedule Grid */}
        <AdminScheduleGrid
          selectedMonth={{ month: selectedMonth, year: selectedYear }}
          employees={employees}
        />

        {/* Daily Statistics */}
        <section className="px-container-margin py-4">
          <h2 className="text-sm font-semibold text-on-surface-variant mb-3">Statistik Shift</h2>
          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center animate-pulse">
                  <div className="w-8 h-8 mx-auto bg-surface-container-high rounded-lg mb-2" />
                  <div className="h-5 bg-surface-container-high rounded w-8 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
                <div className="w-8 h-8 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">wb_sunny</span>
                </div>
                <p className="text-lg font-bold text-primary">{onDuty}</p>
                <p className="text-[10px] text-on-surface-variant">Total Staff</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
                <div className="w-8 h-8 mx-auto bg-tertiary/10 rounded-lg flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">schedule</span>
                </div>
                <p className="text-lg font-bold text-tertiary">{Math.floor(onDuty * 0.3)}</p>
                <p className="text-[10px] text-on-surface-variant">Pagi</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
                <div className="w-8 h-8 mx-auto bg-tertiary/10 rounded-lg flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-tertiary text-[18px]">light_mode</span>
                </div>
                <p className="text-lg font-bold text-tertiary">{Math.floor(onDuty * 0.35)}</p>
                <p className="text-[10px] text-on-surface-variant">Siang</p>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
                <div className="w-8 h-8 mx-auto bg-secondary/10 rounded-lg flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-secondary text-[18px]">nightlight</span>
                </div>
                <p className="text-lg font-bold text-secondary">{Math.floor(onDuty * 0.35)}</p>
                <p className="text-[10px] text-on-surface-variant">Malam</p>
              </div>
            </div>
          )}
        </section>

        {/* Monthly Summary */}
        <section className="px-container-margin py-4">
          <h2 className="text-sm font-semibold text-on-surface-variant mb-3">
            Ringkasan Bulan {selectedMonth}/{selectedYear}
          </h2>
          {loading ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 animate-pulse">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 bg-surface-container-high rounded w-20" />
                    <div className="h-6 bg-surface-container-high rounded w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="grid grid-cols-2">
                <div className="p-4 border-r border-b border-outline-variant">
                  <p className="text-[10px] text-on-surface-variant uppercase">Total Hari Kerja</p>
                  <p className="text-xl font-bold text-on-surface">{monthlyStats?.totalWorkDays || 22} Hari</p>
                </div>
                <div className="p-4 border-b border-outline-variant">
                  <p className="text-[10px] text-on-surface-variant uppercase">Kehadiran</p>
                  <p className="text-xl font-bold text-on-surface">{monthlyStats?.attendanceRate || 98.5}%</p>
                </div>
                <div className="p-4 border-r border-outline-variant">
                  <p className="text-[10px] text-on-surface-variant uppercase">Total Jam Lembur</p>
                  <p className="text-xl font-bold text-on-surface">{monthlyStats?.overtimeHours || 0} Jam</p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-on-surface-variant uppercase">Total Staff</p>
                  <p className="text-xl font-bold text-on-surface">{onDuty} Org</p>
                </div>
              </div>
            </div>
          )}
        </section>

        <ShiftLegend />
      </main>

      <AdminBottomNav />
    </div>
  );
}