"use client";

import { useState } from "react";
import { employeeRequestTypeOptions } from "@/data/employeeData";

export default function EmployeeRequestForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = () => {
    setStatus("submitting");
    setTimeout(() => {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    }, 1000);
  };

  const getButtonText = () => {
    switch (status) {
      case "submitting":
        return "Mengirim...";
      case "success":
        return "Berhasil Terkirim!";
      default:
        return "Kirim Pengajuan";
    }
  };

  const getButtonClasses = () => {
    const baseClasses = "w-full h-12 text-base font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all";
    if (status === "success") {
      return `${baseClasses} bg-green-600 text-white`;
    }
    if (status === "submitting") {
      return `${baseClasses} bg-primary text-on-primary opacity-50`;
    }
    return `${baseClasses} bg-primary text-on-primary`;
  };

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
      <h2 className="text-xs text-primary uppercase tracking-wider mb-3 font-semibold">
        Buat Pengajuan Baru
      </h2>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-on-surface-variant uppercase">
              Tanggal Mulai
            </label>
            <div className="flex items-center gap-2 border border-outline-variant rounded px-2 py-2 bg-surface">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                calendar_today
              </span>
              <span className="text-sm">24 Mei 2026</span>
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-on-surface-variant uppercase">
              Tanggal Selesai
            </label>
            <div className="flex items-center gap-2 border border-outline-variant rounded px-2 py-2 bg-surface">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                calendar_today
              </span>
              <span className="text-sm">25 Mei 2026</span>
            </div>
          </div>
        </div>

        {/* Request Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-on-surface-variant uppercase">
            Jenis Pengajuan
          </label>
          <select className="w-full border border-outline-variant rounded px-2 py-2 bg-surface text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none">
            {employeeRequestTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={status !== "idle"}
          className={getButtonClasses()}
        >
          {getButtonText()}
        </button>
      </div>
    </section>
  );
}