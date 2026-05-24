"use client";

import { useState } from "react";
import { employeeRequestTypeOptions } from "@/data/employeeData";

export default function EmployeeRequestForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  // Date state
  const today = new Date();
  const [startDate, setStartDate] = useState(
    today.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Request type state
  const [requestType, setRequestType] = useState(employeeRequestTypeOptions[0].value);

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

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
            <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="startDate">
              Tanggal Mulai
            </label>
            <div className="relative flex items-center gap-2 border border-outline-variant rounded px-2 py-2 bg-surface hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                calendar_today
              </span>
              <span className="text-sm text-on-surface">{formatDisplayDate(startDate)}</span>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // If end date is before start date, update end date
                  if (endDate < e.target.value) {
                    setEndDate(e.target.value);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="endDate">
              Tanggal Selesai
            </label>
            <div className="relative flex items-center gap-2 border border-outline-variant rounded px-2 py-2 bg-surface hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                event
              </span>
              <span className="text-sm text-on-surface">{formatDisplayDate(endDate)}</span>
              <input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Request Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="requestType">
            Jenis Pengajuan
          </label>
          <div className="relative">
            <select
              id="requestType"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full border border-outline-variant rounded px-3 py-2.5 bg-surface text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none pr-10"
            >
              {employeeRequestTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-secondary pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="description">
            Keterangan (Opsional)
          </label>
          <textarea
            id="description"
            placeholder="Tambahkan keterangan jika diperlukan..."
            className="w-full border border-outline-variant rounded px-3 py-2.5 bg-surface text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
            rows={3}
          />
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