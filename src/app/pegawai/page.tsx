"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import EmployeeTopBar from "@/components/pegawai/EmployeeTopBar";
import EmployeeBottomNav from "@/components/pegawai/EmployeeBottomNav";
import { useAuth } from "@/lib/authContext";

interface TodaySchedule {
  shiftType: string;
  time: string;
  department: string;
  hasClockedIn: boolean;
  clockInTime?: string;
}

interface UpcomingShift {
  date: Date;
  time: string;
  shiftCode: string;
  label: string;
}

interface Activity {
  id: string;
  type: "success" | "info" | "warning";
  title: string;
  description: string;
  time: string;
}

const shiftColorMap: Record<string, string> = {
  P: "bg-primary",
  MID: "bg-tertiary",
  S: "bg-tertiary",
  M: "bg-secondary",
  L: "bg-outline",
};

export default function PegawaiPage() {
  const { user, token } = useAuth();
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule | null>(null);
  const [upcomingShifts, setUpcomingShifts] = useState<UpcomingShift[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leaveBalance, setLeaveBalance] = useState({ cuti: 12, sakit: 5, kompensasi: 2 });
  const stats = { attendance: 98, totalHours: 160 };

  // Get user name without suffix
  const getDisplayName = (name: string): string => {
    if (!name) return "Pegawai";
    const parts = name.split(",");
    return parts[0].trim();
  };

  // Format date
  const formatDate = () => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id || !token) return;

      try {
        // Fetch leave balance
        const balanceRes = await fetch(`/api/users/${user.id}/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json();
          if (balanceData.balance) {
            setLeaveBalance({
              cuti: balanceData.balance.annualLeave,
              sakit: balanceData.balance.sickLeave,
              kompensasi: balanceData.balance.compensation,
            });
          }
        }

        // Fetch today's schedule
        const scheduleRes = await fetch(
          `/api/schedules?userId=${user.id}&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json();
          const today = new Date().toISOString().split("T")[0];
          const todayShift = scheduleData.schedule?.find(
            (s: { date: string }) => s.date.split("T")[0] === today
          );

          if (todayShift) {
            const shiftMap: Record<string, { time: string; code: string }> = {
              PAGI: { time: "07:00 — 14:00", code: "P" },
              MIDDLE: { time: "10:00 — 17:00", code: "MID" },
              SIANG: { time: "14:00 — 21:00", code: "S" },
              MALAM: { time: "21:00 — 07:00", code: "M" },
              LIBUR: { time: "Libur", code: "L" },
              CUTI: { time: "Cuti", code: "C" },
              TURUN: { time: "Turun", code: "X" },
            };
            const shiftInfo = shiftMap[todayShift.shiftType] || { time: "-", code: "-" };

            setTodaySchedule({
              shiftType: todayShift.shiftType,
              time: shiftInfo.time,
              department: user.position || "Farmasi",
              hasClockedIn: true,
              clockInTime: "07:55",
            });
          }
        }

        // Fetch recent requests (for activities)
        const requestsRes = await fetch(`/api/requests?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          const recentActivities: Activity[] = requestsData.requests?.slice(0, 5).map((req: any, idx: number) => {
            let type: "success" | "info" | "warning" = "info";
            let description = `Request ${req.type.replace("_", " ").toLowerCase()}`;

            if (req.status === "APPROVED") {
              type = "success";
              description = `Pengajuan ${req.type.replace("_", " ").toLowerCase()} telah disetujui.`;
            } else if (req.status === "PENDING") {
              type = "info";
              description = `Menunggu persetujuan untuk ${req.type.replace("_", " ").toLowerCase()}.`;
            } else if (req.status === "REJECTED") {
              type = "warning";
              description = `Pengajuan ${req.type.replace("_", " ").toLowerCase()} ditolak.`;
            }

            const days = ["2j", "3j", "Kemarin", "2 hari", "3 hari"];
            return {
              id: req.id,
              type,
              title: `Request ${req.type.replace("_", " ")}`,
              description,
              time: days[idx] || `${idx + 1} hari`,
            };
          }) || [];

          setActivities(recentActivities);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();
  }, [user?.id, token, user?.position]);

  // Generate upcoming shifts based on today's schedule
  useEffect(() => {
    const generateUpcoming = () => {
      const shifts: UpcomingShift[] = [];
      const today = new Date();

      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Simulate different shifts
        const shiftTypes = [
          { time: "08:00", code: "P", label: "P (Pagi)" },
          { time: "14:00", code: "S", label: "S (Siang)" },
          { time: "OFF", code: "L", label: "Libur Mingguan" },
        ];

        const shift = shiftTypes[i % 3];
        shifts.push({
          date,
          time: shift.time,
          shiftCode: shift.code,
          label: shift.label,
        });
      }

      setUpcomingShifts(shifts);
    };

    generateUpcoming();
  }, []);

  const formatUpcomingDate = (date: Date, index: number): string => {
    if (index === 1) return "Besok";
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    return `${days[date.getDay()]}, ${date.getDate()} ${date.toLocaleDateString("id-ID", { month: "short" })}`;
  };

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "success":
        return { icon: "check_circle", bg: "bg-green-100", color: "text-green-700" };
      case "warning":
        return { icon: "warning", bg: "bg-amber-100", color: "text-amber-700" };
      default:
        return { icon: "info", bg: "bg-blue-100", color: "text-blue-700" };
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <EmployeeTopBar />

      <main className="pt-14 px-container-margin max-w-2xl mx-auto space-y-6">
        {/* Welcome Section */}
        <section className="space-y-1">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            Selamat Datang, {getDisplayName(user?.name || "")}!
          </h1>
          <p className="font-body-md text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            {formatDate()}
          </p>
        </section>

        {/* Quick Stats Bento Grid */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col justify-between h-32">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Sisa Cuti</span>
            <div>
              <span className="font-headline-lg text-headline-lg text-primary">{leaveBalance.cuti}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">Hari</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="bg-secondary-container text-on-secondary-container p-2 rounded-lg">
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              </div>
              <div>
                <div className="font-label-xs text-label-xs text-on-surface-variant uppercase">Kehadiran</div>
                <div className="font-headline-md text-headline-md">{stats.attendance}%</div>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex items-center gap-3">
              <div className="bg-tertiary-fixed text-on-tertiary-fixed p-2 rounded-lg">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </div>
              <div>
                <div className="font-label-xs text-label-xs text-on-surface-variant uppercase">Total Jam</div>
                <div className="font-headline-md text-headline-md">{stats.totalHours}h</div>
              </div>
            </div>
          </div>
        </section>

        {/* Today's Schedule Card */}
        <section>
          <h2 className="font-label-sm text-label-sm text-on-surface-variant mb-3 uppercase tracking-wider">Jadwal Hari Ini</h2>
          {todaySchedule ? (
            <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
              <div className="p-5 flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed font-label-xs text-label-xs">
                      {todaySchedule.shiftType}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Lantai 1 • {todaySchedule.department}
                    </span>
                  </div>
                  <div className="font-headline-lg text-headline-lg">{todaySchedule.time}</div>
                  <p className="font-body-md text-on-surface-variant">
                    {todaySchedule.hasClockedIn ? `Sudah Absen Masuk (${todaySchedule.clockInTime})` : "Belum Absen"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button className="bg-primary text-on-primary font-label-sm text-label-sm px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm active:scale-95 transition-transform">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Absen Keluar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm p-5">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-outline"></div>
              <div className="text-center">
                <span className="font-headline-md text-on-surface-variant">Tidak ada jadwal hari ini</span>
                <p className="font-body-md text-on-surface-variant mt-1">Libur atau belum ada jadwal</p>
              </div>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section className="grid grid-cols-3 gap-3">
          <Link
            href="/pegawai/requests"
            className="bg-surface-container-low hover:bg-surface-container-high transition-colors p-4 rounded-xl flex flex-col items-center gap-2 group"
          >
            <span className="material-symbols-outlined text-primary group-active:scale-90 transition-transform">event_note</span>
            <span className="font-label-sm text-label-sm text-center">Ajukan Jadwal</span>
          </Link>
          <Link
            href="/pegawai/requests"
            className="bg-surface-container-low hover:bg-surface-container-high transition-colors p-4 rounded-xl flex flex-col items-center gap-2 group"
          >
            <span className="material-symbols-outlined text-primary group-active:scale-90 transition-transform">swap_horiz</span>
            <span className="font-label-sm text-label-sm text-center">Tukar Shift</span>
          </Link>
          <Link
            href="/pegawai/roster"
            className="bg-surface-container-low hover:bg-surface-container-high transition-colors p-4 rounded-xl flex flex-col items-center gap-2 group"
          >
            <span className="material-symbols-outlined text-primary group-active:scale-90 transition-transform">grid_view</span>
            <span className="font-label-sm text-label-sm text-center">Lihat Roster</span>
          </Link>
        </section>

        {/* Upcoming Shifts */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Shift Mendatang</h2>
            <Link href="/pegawai/roster" className="text-primary font-label-sm text-label-sm">
              Lihat Semua
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {upcomingShifts.map((shift, idx) => (
              <div
                key={idx}
                className="min-w-[140px] bg-white border border-outline-variant p-4 rounded-xl space-y-3 flex-shrink-0"
              >
                <div className="font-label-sm text-label-sm text-on-surface-variant">
                  {formatUpcomingDate(shift.date, idx)}
                </div>
                <div className="font-headline-md text-headline-md">{shift.time}</div>
                <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full ${shiftColorMap[shift.shiftCode] || "bg-primary"} w-full`}></div>
                </div>
                <div className="font-label-xs text-label-xs text-on-surface-variant">{shift.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity Feed */}
        <section>
          <h2 className="font-label-sm text-label-sm text-on-surface-variant mb-3 uppercase tracking-wider">Aktivitas Terakhir</h2>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity) => {
                const { icon, bg, color } = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex gap-4 p-3 bg-surface-container-lowest border border-outline-variant rounded-xl items-start">
                    <div className={`${bg} p-2 rounded-full flex-shrink-0`}>
                      <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-label-sm text-label-sm text-on-surface">{activity.title}</h4>
                        <span className="font-label-xs text-label-xs text-on-surface-variant">{activity.time}</span>
                      </div>
                      <p className="font-body-md text-on-surface-variant text-sm mt-0.5">{activity.description}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] opacity-50">history</span>
                <p className="mt-2">Belum ada aktivitas</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <EmployeeBottomNav />
    </div>
  );
}