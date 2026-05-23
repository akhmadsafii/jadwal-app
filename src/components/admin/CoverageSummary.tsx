"use client";

import { shiftCoverage } from "@/data/adminData";

export default function CoverageSummary() {
  const vacancies = shiftCoverage.filter(s => s.current < s.total).length;

  return (
    <section className="px-container-margin">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xs uppercase tracking-wider text-outline">
            Shift Coverage Summary
          </h2>
          {vacancies > 0 && (
            <span className="text-[10px] bg-error-container text-on-error-container px-2 py-0.5 rounded-full font-bold">
              {vacancies} Vacancies
            </span>
          )}
        </div>
        <div className="space-y-4">
          {shiftCoverage.map((shift, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant">
                <span>
                  {shift.name} ({shift.time})
                </span>
                <span>
                  {shift.current}/{shift.total} Staff
                </span>
              </div>
              <div className="h-3 w-full bg-surface-container-high rounded-full overflow-hidden flex">
                <div
                  className={`h-full ${shift.color}`}
                  style={{ width: `${(shift.current / shift.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}