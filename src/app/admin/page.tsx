"use client";

import { useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import CoverageSummary from "@/components/admin/CoverageSummary";
import QuickActions from "@/components/admin/QuickActions";
import ScheduleGrid from "@/components/admin/ScheduleGrid";
import SaveActions from "@/components/admin/SaveActions";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { adminStaff, ShiftType } from "@/data/adminData";

export default function AdminSchedulePage() {
  const [schedule, setSchedule] = useState<Record<string, Record<string, ShiftType>>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleShiftChange = (staffId: string, date: Date, shift: ShiftType) => {
    const dateKey = date.toISOString().split("T")[0];
    setSchedule((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [dateKey]: shift,
      },
    }));
  };

  const handleAutoFill = () => {
    // Auto-fill logic - assign shifts evenly
    const newSchedule: Record<string, Record<string, ShiftType>> = {};
    const shifts: ShiftType[] = ["PAGI", "MIDDLE", "SIANG", "MALAM"];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);

    adminStaff.forEach((staff, staffIdx) => {
      newSchedule[staff.id] = {};
      for (let day = 0; day < 7; day++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + day);
        const dateKey = date.toISOString().split("T")[0];
        // Distribute shifts evenly: PAGI, MIDDLE, SIANG
        const shiftIndex = (staffIdx + day) % 3;
        newSchedule[staff.id][dateKey] = shifts[shiftIndex];
      }
    });

    setSchedule(newSchedule);
  };

  const handleBulkCopy = () => {
    // Copy from previous week - simplified implementation
    const newSchedule = { ...schedule };
    const today = new Date();

    adminStaff.forEach((staff) => {
      const staffSchedule = schedule[staff.id];
      if (staffSchedule) {
        // Copy to next week
        Object.entries(staffSchedule).forEach(([dateKey, shift]) => {
          const date = new Date(dateKey);
          date.setDate(date.getDate() + 7);
          const newDateKey = date.toISOString().split("T")[0];
          if (!newSchedule[staff.id]) {
            newSchedule[staff.id] = {};
          }
          newSchedule[staff.id][newDateKey] = shift;
        });
      }
    });

    setSchedule(newSchedule);
  };

  const handleClearAll = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua jadwal minggu ini?")) {
      setSchedule({});
    }
  };

  const handlePublishSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <AdminTopBar />

      <main className="flex-1 w-full flex flex-col gap-4 py-4 overflow-x-hidden">
        <CoverageSummary />
        <QuickActions
          onAutoFill={handleAutoFill}
          onBulkCopy={handleBulkCopy}
          onClearAll={handleClearAll}
        />
        <ScheduleGrid
          staff={adminStaff}
          onShiftChange={handleShiftChange}
        />
        <SaveActions
          schedule={schedule}
          onPublishSuccess={handlePublishSuccess}
        />
      </main>

      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined">check_circle</span>
          Jadwal berhasil dipublish!
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}