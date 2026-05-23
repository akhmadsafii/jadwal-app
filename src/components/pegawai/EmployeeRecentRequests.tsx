"use client";

import Link from "next/link";
import { employeeRequests, employeeRequestTypeLabels, employeeRequestStatusLabels, employeeRequestStatusColors, employeeRequestIcons } from "@/data/employeeData";

export default function EmployeeRecentRequests() {
  const getIconBgColor = (type: string) => {
    switch (type) {
      case "shift_pagi":
        return "bg-primary-container";
      case "shift_malam":
        return "bg-secondary-container";
      case "cuti_tahunan":
        return "bg-tertiary-container";
      case "tukar_shift":
        return "bg-surface-dim";
      default:
        return "bg-primary-container";
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-xs text-on-surface-variant uppercase tracking-wider">
          Pengajuan Terakhir
        </h2>
        <Link href="/login" className="text-[10px] text-primary font-bold hover:underline">
          LIHAT SEMUA
        </Link>
      </div>
      <div className="space-y-2">
        {employeeRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-3 p-3 bg-surface-container border border-outline-variant rounded-lg"
          >
            <div className={`w-10 h-10 rounded flex items-center justify-center ${getIconBgColor(request.type)}`}>
              <span className="material-symbols-outlined text-primary">
                {employeeRequestIcons[request.type]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">
                {employeeRequestTypeLabels[request.type]}
              </p>
              <p className="text-[10px] text-secondary">
                {request.endDate
                  ? `${request.startDate} - ${request.endDate}`
                  : request.startDate}
              </p>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded ${employeeRequestStatusColors[request.status]}`}
            >
              {employeeRequestStatusLabels[request.status]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}