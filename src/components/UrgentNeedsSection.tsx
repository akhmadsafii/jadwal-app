"use client";

import { useEffect, useState } from "react";

export default function UrgentNeedsSection() {
  const [urgentNeeds, setUrgentNeeds] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/requests?status=PENDING")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const items = (data?.requests || []).slice(0, 2).map((request: any) => ({
          id: request.id,
          date: new Date(request.startDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }).toUpperCase(),
          title: request.description || request.type.replaceAll("_", " "),
          icon: request.type === "CUTI_TAHUNAN" ? "event_busy" : "priority_high",
          bgColor: "bg-error-container",
          textColor: "text-on-error-container",
          borderColor: "border-error/20",
        }));
        setUrgentNeeds(items);
      })
      .catch(() => setUrgentNeeds([]));
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-label text-label-sm text-on-surface-variant uppercase tracking-wider">
          Kebutuhan Mendesak
        </h2>
        <span className="font-label text-label-xs text-primary font-bold cursor-pointer hover:underline">
          LIHAT SEMUA
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {urgentNeeds.length === 0 ? (
          <div className="col-span-2 p-4 text-center text-sm text-outline bg-surface-container border border-outline-variant rounded-xl">
            Tidak ada kebutuhan mendesak
          </div>
        ) : urgentNeeds.map((need) => (
          <div
            key={need.id}
            className={`${need.bgColor} p-3 rounded-xl border ${need.borderColor} flex flex-col justify-between h-24`}
          >
            <div className="flex justify-between items-start">
              <span
                className={`font-label text-label-xs ${need.textColor} bg-white/50 px-1.5 py-0.5 rounded`}
              >
                {need.date}
              </span>
              <span className="material-symbols-outlined text-error text-[18px]">
                {need.icon}
              </span>
            </div>
            <p
              className={`font-body-md text-body-md font-semibold leading-tight ${need.textColor}`}
            >
              {need.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
