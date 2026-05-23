"use client";

import { shiftLegend } from "@/data/publicData";

export default function ShiftLegend() {
  return (
    <section className="mt-4 px-container-margin">
      <h2 className="text-xs text-outline uppercase mb-2">Shift Legend</h2>
      <div className="grid grid-cols-3 gap-2">
        {shiftLegend.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 bg-surface-container p-2 rounded-lg"
          >
            <span
              className={`w-6 h-6 flex items-center justify-center rounded text-[10px] font-bold ${item.cellClass}`}
            >
              {item.code}
            </span>
            <span className="text-[10px] text-on-surface-variant">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}