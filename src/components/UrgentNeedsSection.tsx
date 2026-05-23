"use client";

import { urgentNeeds } from "@/data/mockData";

export default function UrgentNeedsSection() {
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
        {urgentNeeds.map((need) => (
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