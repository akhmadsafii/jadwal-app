"use client";

import {
  recentRequests,
  requestTypeLabels,
  requestStatusLabels,
  requestStatusColors,
  requestIcons,
  requestIconBg,
} from "@/data/mockData";

export default function RecentRequests() {
  return (
    <section>
      <h2 className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">
        Pengajuan Terakhir
      </h2>
      <div className="space-y-2">
        {recentRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center gap-3 p-3 bg-surface-container border border-outline-variant rounded-lg"
          >
            <div
              className={`w-10 h-10 rounded ${requestIconBg[request.type]} flex items-center justify-center`}
            >
              <span className="material-symbols-outlined text-primary">
                {requestIcons[request.type]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body-md font-semibold truncate">
                {requestTypeLabels[request.type]}
              </p>
              <p className="font-label text-label-sm text-secondary">
                {request.endDate
                  ? `${request.startDate} - ${request.endDate}`
                  : request.startDate}
              </p>
            </div>
            <span
              className={`text-label-xs font-bold px-2 py-1 rounded ${requestStatusColors[request.status]}`}
            >
              {requestStatusLabels[request.status]}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}