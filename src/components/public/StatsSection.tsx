"use client";

import { useEffect, useState } from "react";

interface StatsSectionProps {
  selectedMonth?: { month: number; year: number };
}

const monthNames = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function StatsSection({ selectedMonth }: StatsSectionProps) {
  // Get month/year from selectedMonth or use current date
  const month = selectedMonth?.month || new Date().getMonth() + 1;
  const year = selectedMonth?.year || new Date().getFullYear();

  const monthName = `${monthNames[month - 1]} ${year}`;

  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/schedules?month=${month}&year=${year}`)
      .then((response) => response.ok ? response.json() : null)
      .then(setData)
      .catch(() => setData(null));
  }, [month, year]);

  const distribution = data?.shiftDistribution || [];
  const stats = [
    { label: "Total Hari Kerja", value: `${data?.monthlyStats?.totalWorkDays || 0} Hari`, colorClass: "text-primary" },
    { label: "Persentase Kehadiran", value: `${data?.monthlyStats?.attendanceRate || 0}%`, colorClass: "text-tertiary" },
    { label: "Total Jam Lembur", value: `${data?.monthlyStats?.overtimeHours || 0} Jam`, colorClass: "text-on-surface" },
    { label: "Total Staff", value: `${data?.employees?.length || 0} Org`, colorClass: "text-secondary" },
  ];
  const onDuty = data?.employees?.filter((employee: any) =>
    employee.schedule?.some((assignment: any) => assignment.shiftType !== "LIBUR")
  ).length || 0;
  const totalStaff = data?.employees?.length || 0;
  const percentage = totalStaff > 0 ? Math.round((onDuty / totalStaff) * 100) : 0;

  return (
    <section className="mt-8 px-container-margin pb-24">
      <h2 className="text-lg text-on-surface mb-4 font-semibold">
        Statistik Bulanan
      </h2>

      {/* Monthly Shift Breakdown */}
      <div className="mb-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <h3 className="text-xs text-outline uppercase mb-4">
          Distribusi Shift Bulan {monthName}
        </h3>
        <div className="space-y-4">
          {distribution.map((shift: any, idx: number) => {
            return (
              <div key={idx}>
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-on-surface-variant font-semibold">
                    {shift.name}
                  </span>
                  <span className="font-bold">{shift.count || 0} Jadwal</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${shift.color}`}
                    style={{ width: `${shift.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Bar */}
        <div className="mt-4 pt-4 border-t border-outline-variant">
          <p className="text-[10px] text-outline mb-2">Total Distribution</p>
          <div className="flex h-4 rounded-full overflow-hidden">
            {distribution.map((shift: any) => (
              <div key={shift.code} className={shift.color} style={{ width: `${shift.percentage}%` }} title={`${shift.name}: ${shift.percentage}%`} />
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="mb-6">
        <h3 className="text-xs text-outline uppercase mb-3">Ringkasan Bulan {monthName}</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant"
            >
              <p className="text-[10px] text-outline mb-1">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.colorClass}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Availability */}
      <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <h3 className="text-xs text-outline uppercase mb-3">Ketersediaan Staf</h3>
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="relative w-20 h-20">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="stroke-surface-container-highest"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="4"
              />
              <path
                className="stroke-primary"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="4"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">
                {percentage}%
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] text-on-surface-variant">
                On-Duty ({onDuty} org)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-surface-container-highest" />
              <span className="text-[10px] text-on-surface-variant">
                Off-Duty ({Math.max(totalStaff - onDuty, 0)} org)
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
