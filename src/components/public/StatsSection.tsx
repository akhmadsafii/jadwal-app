"use client";

import { shiftDistribution, monthlyStats, staffAvailability } from "@/data/publicData";

export default function StatsSection() {
  return (
    <section className="mt-8 px-container-margin pb-8">
      <h2 className="text-lg text-on-surface mb-4 font-semibold">
        Statistik Kehadiran & Shift
      </h2>

      {/* Shift Distribution */}
      <div className="mb-6 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <h3 className="text-xs text-outline uppercase mb-3">
          Distribusi Shift Hari Ini
        </h3>
        <div className="space-y-4">
          {shiftDistribution.map((shift, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-on-surface-variant">{shift.name}</span>
                <span className="font-bold">{shift.percentage}%</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${shift.color}`}
                  style={{ width: `${shift.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="mb-6">
        <h3 className="text-xs text-outline uppercase mb-3">Ringkasan Bulanan</h3>
        <div className="grid grid-cols-2 gap-3">
          {monthlyStats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant"
            >
              <p className="text-[10px] text-outline mb-1">{stat.label}</p>
              <p className={`font-semibold ${stat.colorClass}`}>{stat.value}</p>
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
                strokeDasharray={`${staffAvailability.percentage}, 100`}
                strokeWidth="4"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">
                {staffAvailability.percentage}%
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] text-on-surface-variant">
                On-Duty ({staffAvailability.onDuty})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-surface-container-highest" />
              <span className="text-[10px] text-on-surface-variant">
                Off-Duty ({staffAvailability.offDuty})
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}