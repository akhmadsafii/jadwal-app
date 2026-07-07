"use client";

import { useEffect, useState } from "react";
import AdminTopBar from "@/components/admin/AdminTopBar";
import CoverageSummary from "@/components/admin/CoverageSummary";
import QuickActions from "@/components/admin/QuickActions";
import ScheduleGrid from "@/components/admin/ScheduleGrid";
import SaveActions from "@/components/admin/SaveActions";
import AdminBottomNav from "@/components/admin/AdminBottomNav";
import { ShiftType } from "@/data/adminData";
import { getDateKeyFromApi } from "@/lib/dateKeys";
import { useAuth } from "@/lib/authContext";

interface AdminStaff {
  id: string;
  name: string;
  staffId: string;
  avatarUrl: string;
  shift: ShiftType;
}

interface RequestScheduleMeta {
  status: "PENDING" | "APPROVED";
  requestId?: string;
  type?: string;
}

interface ApiEmployee {
  id: string;
  name: string;
  nip: string;
  avatarUrl?: string | null;
  schedule?: ApiScheduleAssignment[];
}

interface ApiScheduleAssignment {
  date: string;
  dateKey?: string;
  shiftType: ShiftType;
  fromRequest?: boolean;
  requestStatus?: "PENDING" | "APPROVED";
  requestId?: string;
  requestType?: string;
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AdminSchedulePage() {
  const { token, isLoading: isLoadingAuth } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });
  const [schedule, setSchedule] = useState<Record<string, Record<string, ShiftType>>>({});
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [initialSchedule, setInitialSchedule] = useState<Record<string, Record<string, ShiftType>>>({});
  const [requestScheduleMeta, setRequestScheduleMeta] = useState<Record<string, Record<string, RequestScheduleMeta>>>({});
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [hasDraft, setHasDraft] = useState(false);

  const toAdminStaff = (employee: ApiEmployee, loadedSchedule: Record<string, Record<string, ShiftType>> = {}): AdminStaff => {
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
      if (isLoadingAuth || !token) return;
      setIsLoadingStaff(true);
      setLoadError("");

      try {
        const usersResponse = await fetch("/api/users?role=EMPLOYEE");
        if (!usersResponse.ok) {
          throw new Error("Gagal mengambil data pegawai");
        }

        const usersData = await usersResponse.json();
        const employees = (usersData.users || []) as ApiEmployee[];
        setStaff(employees.map((employee) => toAdminStaff(employee)));

        const scheduleResponse = await fetch(
          `/api/schedules?month=${currentMonth.month}&year=${currentMonth.year}&includePendingRequests=1&includeDrafts=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!scheduleResponse.ok) {
          return;
        }

        const data = await scheduleResponse.json();
        setHasDraft(Boolean(data.hasDraft));
        const loadedSchedule: Record<string, Record<string, ShiftType>> = {};
        const requestMeta: Record<string, Record<string, RequestScheduleMeta>> = {};
        const scheduleEmployees = (data.employees || []) as ApiEmployee[];
        scheduleEmployees.forEach((employee) => {
          loadedSchedule[employee.id] = {};
          requestMeta[employee.id] = {};
          employee.schedule?.forEach((assignment) => {
            const dateKey = assignment.dateKey || getDateKeyFromApi(assignment.date);
            loadedSchedule[employee.id][dateKey] = assignment.shiftType;
            if (assignment.fromRequest) {
              const isApproved = assignment.requestStatus === "APPROVED";
              requestMeta[employee.id][dateKey] = {
                status: isApproved ? "APPROVED" : "PENDING",
                requestId: assignment.requestId,
                type: assignment.requestType,
              };
            }
          });
        });

        setStaff(
          employees.map((employee) => toAdminStaff(employee, loadedSchedule))
        );
        setInitialSchedule(loadedSchedule);
        setSchedule(loadedSchedule);
        setRequestScheduleMeta(requestMeta);
      } catch (error) {
        console.error("Failed to load admin schedule data:", error);
        setLoadError("Data pegawai belum bisa dimuat. Pastikan tabel User sudah berisi pegawai.");
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaffAndSchedule();
  }, [currentMonth.month, currentMonth.year, isLoadingAuth, token]);

  const handleShiftChange = (staffId: string, date: Date, shift: ShiftType) => {
    const dateKey = getDateKey(date);
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

    staff.forEach((member) => {
      const staffSchedule = schedule[member.id];
      if (staffSchedule) {
        // Copy to next week
        Object.entries(staffSchedule).forEach(([dateKey, shift]) => {
          const date = new Date(dateKey);
          date.setDate(date.getDate() + 7);
          const newDateKey = getDateKey(date);
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
      setSchedule({});
      setInitialSchedule({});
    }
  };

  const handleSaveSuccess = (action: "draft" | "publish") => {
    setHasDraft(action === "draft");
    setSuccessMessage(action === "draft"
      ? "Draft tersimpan dan hanya terlihat oleh admin."
      : "Jadwal berhasil dipublish ke pegawai!");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col pb-24">
      <AdminTopBar />

      <main className="flex-1 w-full flex flex-col gap-4 py-4 overflow-x-hidden">
        {hasDraft && (
          <div className="mx-container-margin rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-center gap-2">
            <span className="material-symbols-outlined">draft</span>
            Anda sedang mengedit versi draft. Pegawai masih melihat jadwal terakhir yang dipublish.
          </div>
        )}
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
              requestScheduleMeta={requestScheduleMeta}
              onMonthChange={setCurrentMonth}
              onShiftChange={handleShiftChange}
            />
            <SaveActions
              schedule={schedule}
              month={currentMonth.month}
              year={currentMonth.year}
              onSaveSuccess={handleSaveSuccess}
            />
          </>
        )}
      </main>

      {showSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined">check_circle</span>
          {successMessage}
        </div>
      )}

      <AdminBottomNav />
    </div>
  );
}
