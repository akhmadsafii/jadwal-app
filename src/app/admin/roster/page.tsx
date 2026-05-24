"use client";

import { useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import MonthSelector from "@/components/public/MonthSelector";
import AdminScheduleGrid from "@/components/admin/AdminScheduleGrid";
import ShiftLegend from "@/components/public/ShiftLegend";
import ExportButton from "@/components/admin/ExportButton";
import { getDaysInMonth, getMonthlyStats, getStaffAvailability, generateScheduleForMonth, staffData } from "@/data/publicData";

export default function AdminRosterPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const daysInMonth = getDaysInMonth(selectedMonth.year, selectedMonth.month);
  const monthlyStats = getMonthlyStats(selectedMonth.year, selectedMonth.month);
  const staffAvailability = getStaffAvailability(selectedMonth.year, selectedMonth.month);

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth({ month, year });
  };

  // Prepare data for export
  const exportData = staffData.map((staff) => {
    const schedule = generateScheduleForMonth(staff.id, selectedMonth.year, selectedMonth.month);
    return {
      name: staff.name,
      nip: staff.nip,
      schedule: schedule.join(", "),
    };
  });

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <AdminTopBar />

      <main className="flex-1 w-full flex flex-col gap-4 py-4 overflow-x-hidden">
        {/* Header with Export Button */}
        <div className="px-container-margin flex items-center justify-between">
          <h1 className="text-lg font-semibold text-on-surface">Jadwal Semua Pegawai</h1>
          <ExportButton
            data={exportData}
            month={selectedMonth.month}
            year={selectedMonth.year}
          />
        </div>

        {/* Month Selector */}
        <div className="px-container-margin">
          <MonthSelector onMonthChange={handleMonthChange} />
        </div>

        {/* Schedule Grid */}
        <AdminScheduleGrid
          staff={staffData}
          selectedMonth={selectedMonth}
        />

        {/* Daily Statistics */}
        <section className="px-container-margin py-4">
          <h2 className="text-sm font-semibold text-on-surface-variant mb-3">Statistik Shift Hari Ini</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-primary text-[18px]">wb_sunny</span>
              </div>
              <p className="text-lg font-bold text-primary">{staffAvailability.onDuty}</p>
              <p className="text-[10px] text-on-surface-variant">Pagi</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto bg-tertiary/10 rounded-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]">schedule</span>
              </div>
              <p className="text-lg font-bold text-tertiary">{Math.floor(staffAvailability.onDuty * 0.5)}</p>
              <p className="text-[10px] text-on-surface-variant">Middle</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto bg-tertiary/10 rounded-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]">light_mode</span>
              </div>
              <p className="text-lg font-bold text-tertiary">{Math.floor(staffAvailability.onDuty * 0.6)}</p>
              <p className="text-[10px] text-on-surface-variant">Siang</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-center">
              <div className="w-8 h-8 mx-auto bg-secondary/10 rounded-lg flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">nightlight</span>
              </div>
              <p className="text-lg font-bold text-secondary">{Math.floor(staffAvailability.onDuty * 0.4)}</p>
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
                <p className="text-[10px] text-on-surface-variant uppercase">Total Jam Kerja</p>
                <p className="text-xl font-bold text-on-surface">{monthlyStats[0].value}</p>
              </div>
              <div className="p-4 border-b border-outline-variant">
                <p className="text-[10px] text-on-surface-variant uppercase">Kehadiran</p>
                <p className="text-xl font-bold text-on-surface">{monthlyStats[1].value}</p>
              </div>
              <div className="p-4 border-r border-outline-variant">
                <p className="text-[10px] text-on-surface-variant uppercase">Staff Standby</p>
                <p className="text-xl font-bold text-on-surface">{monthlyStats[3].value}</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-on-surface-variant uppercase">Total Staff</p>
                <p className="text-xl font-bold text-on-surface">{staffAvailability.onDuty + staffAvailability.offDuty} Org</p>
              </div>
            </div>
          </div>
        </section>

        <ShiftLegend />
      </main>

      <AdminBottomNav />
    </div>
  );
}