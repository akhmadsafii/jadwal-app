"use client";

import { useState } from "react";
import { requestTypeOptions } from "@/data/mockData";

export default function RequestForm() {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

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
    const baseClasses =
      "w-full h-12 font-headline text-headline-md rounded-xl hover:opacity-90 active:scale-95 transition-all";
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
      <h2 className="font-label text-label-sm text-primary uppercase tracking-wider mb-3 font-semibold">
        Buat Pengajuan Baru
      </h2>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <label className="font-label text-label-xs text-on-surface-variant uppercase">
              Tanggal Mulai
            </label>
            <div className="flex items-center gap-2 border border-outline-variant rounded px-2 py-2 bg-surface">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                calendar_today
              </span>
              <span className="text-body-md font-body-md">24 Okt 2023</span>
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="font-label text-label-xs text-on-surface-variant uppercase">
              Tanggal Selesai
            </label>
            <div className="flex items-center gap-2 border border-outline-variant rounded px-2 py-2 bg-surface">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                calendar_today
              </span>
              <span className="text-body-md font-body-md">25 Okt 2023</span>
            </div>
          </div>
        </div>

        {/* Request Type */}
        <div className="flex flex-col gap-1">
          <label className="font-label text-label-xs text-on-surface-variant uppercase">
            Jenis Pengajuan
          </label>
          <select className="w-full border border-outline-variant rounded px-2 py-2 bg-surface font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none">
            {requestTypeOptions.map((option) => (
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