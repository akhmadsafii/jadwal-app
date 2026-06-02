"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import CoverageSummary from "@/components/admin/CoverageSummary";
import QuickActions from "@/components/admin/QuickActions";
import ScheduleGrid from "@/components/admin/ScheduleGrid";
import SaveActions from "@/components/admin/SaveActions";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { ShiftType } from "@/data/adminData";

interface AdminStaff {
  id: string;
  name: string;
  staffId: string;
  avatarUrl: string;
  shift: ShiftType;
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AdminSchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [schedule, setSchedule] = useState<Record<string, Record<string, ShiftType>>>({});
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [initialSchedule, setInitialSchedule] = useState<Record<string, Record<string, ShiftType>>>({});
  const [requestLockedSchedule, setRequestLockedSchedule] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const toAdminStaff = (employee: any, loadedSchedule: Record<string, Record<string, ShiftType>> = {}): AdminStaff => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return {
      id: employee.id,
      name: employee.name,
      staffId: employee.nip,
      avatarUrl: employee.avatarUrl || "",
      shift: loadedSchedule[employee.id]?.[todayKey] || "LIBUR",
    };
  };

  useEffect(() => {
    const fetchStaffAndSchedule = async () => {
      setIsLoadingStaff(true);
      setLoadError("");

      try {
        const usersResponse = await fetch("/api/users?role=EMPLOYEE");
        if (!usersResponse.ok) {
          throw new Error("Gagal mengambil data pegawai");
        }

        const usersData = await usersResponse.json();
        const employees = usersData.users || [];
        setStaff(employees.map((employee: any) => toAdminStaff(employee)));

        const scheduleResponse = await fetch(`/api/schedules?month=${currentMonth.month}&year=${currentMonth.year}`);

        if (!scheduleResponse.ok) {
          return;
        }

        const data = await scheduleResponse.json();
        const loadedSchedule: Record<string, Record<string, ShiftType>> = {};
        const lockedSchedule: Record<string, Record<string, boolean>> = {};
        (data.employees || []).forEach((employee: any) => {
          loadedSchedule[employee.id] = {};
          lockedSchedule[employee.id] = {};
          employee.schedule?.forEach((assignment: any) => {
            const dateKey = assignment.dateKey || assignment.date.split("T")[0];
            loadedSchedule[employee.id][dateKey] = assignment.shiftType;
            if (assignment.fromRequest) {
              lockedSchedule[employee.id][dateKey] = true;
            }
          });
        });

        setStaff(
          employees.map((employee: any) => toAdminStaff(employee, loadedSchedule))
        );
        setInitialSchedule(loadedSchedule);
        setSchedule(loadedSchedule);
        setRequestLockedSchedule(lockedSchedule);
      } catch (error) {
        console.error("Failed to load admin schedule data:", error);
        setLoadError("Data pegawai belum bisa dimuat. Pastikan tabel User sudah berisi pegawai.");
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaffAndSchedule();
  }, [currentMonth.month, currentMonth.year]);

  const handleShiftChange = (staffId: string, date: Date, shift: ShiftType) => {
    const dateKey = getDateKey(date);
    if (requestLockedSchedule[staffId]?.[dateKey]) return;
    setSchedule((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [dateKey]: shift,
      },
    }));
  };

  const handleAutoFill = () => {
    const newSchedule: Record<string, Record<string, ShiftType>> = {};
    const shifts: ShiftType[] = ["PAGI", "MIDDLE", "SIANG", "MALAM", "LIBUR"];
    const daysInMonth = new Date(currentMonth.year, currentMonth.month, 0).getDate();

    staff.forEach((member, staffIdx) => {
      newSchedule[member.id] = {};
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        if (requestLockedSchedule[member.id]?.[dateKey]) {
          newSchedule[member.id][dateKey] = schedule[member.id]?.[dateKey] || "LIBUR";
          continue;
        }
        const shiftIndex = (staffIdx + day - 1) % shifts.length;
        newSchedule[member.id][dateKey] = shifts[shiftIndex];
      }
    });

    setSchedule(newSchedule);
    setInitialSchedule(newSchedule);
  };

  const handleBulkCopy = () => {
    // Copy from previous week - simplified implementation
    const newSchedule = { ...schedule };
    const today = new Date();

    staff.forEach((member) => {
      const staffSchedule = schedule[member.id];
      if (staffSchedule) {
        // Copy to next week
        Object.entries(staffSchedule).forEach(([dateKey, shift]) => {
          const date = new Date(dateKey);
          date.setDate(date.getDate() + 7);
          const newDateKey = getDateKey(date);
          if (requestLockedSchedule[member.id]?.[newDateKey]) return;
          if (!newSchedule[member.id]) {
            newSchedule[member.id] = {};
          }
          newSchedule[member.id][newDateKey] = shift;
        });
      }
    });

    setSchedule(newSchedule);
    setInitialSchedule(newSchedule);
  };

  const handleClearAll = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua perubahan jadwal bulan ini?")) {
      const lockedOnly: Record<string, Record<string, ShiftType>> = {};
      Object.entries(requestLockedSchedule).forEach(([staffId, dates]) => {
        Object.keys(dates).forEach((dateKey) => {
          const shift = schedule[staffId]?.[dateKey];
          if (!shift) return;
          if (!lockedOnly[staffId]) lockedOnly[staffId] = {};
          lockedOnly[staffId][dateKey] = shift;
        });
      });
      setSchedule(lockedOnly);
      setInitialSchedule(lockedOnly);
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
        {isLoadingStaff ? (
          <div className="mx-container-margin rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-center text-sm text-outline">
            Memuat daftar pegawai...
          </div>
        ) : loadError ? (
          <div className="mx-container-margin rounded-xl border border-error/20 bg-error-container p-6 text-center text-sm text-on-error-container">
            {loadError}
          </div>
        ) : staff.length === 0 ? (
          <div className="mx-container-margin rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-center text-sm text-outline">
            Belum ada pegawai di database. Tambahkan data pegawai dulu agar jadwal bisa diinput.
          </div>
        ) : (
          <>
            <ScheduleGrid
              staff={staff}
              initialDate={new Date(currentMonth.year, currentMonth.month - 1, 1)}
              initialSchedule={initialSchedule}
              requestLockedSchedule={requestLockedSchedule}
              onMonthChange={setCurrentMonth}
              onShiftChange={handleShiftChange}
            />
            <SaveActions
              schedule={schedule}
              onPublishSuccess={handlePublishSuccess}
            />
          </>
        )}
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
