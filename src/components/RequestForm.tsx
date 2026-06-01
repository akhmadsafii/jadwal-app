"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";

const requestTypeOptions = [
  { value: "SHIFT_PAGI", label: "Shift Pagi (07-14)" },
  { value: "SHIFT_MIDDLE", label: "Shift Middle (10-17)" },
  { value: "SHIFT_SIANG", label: "Shift Siang (14-21)" },
  { value: "SHIFT_MALAM", label: "Shift Malam (21-07)" },
  { value: "CUTI_TAHUNAN", label: "Cuti Tahunan" },
  { value: "CUTI_SAKIT", label: "Cuti Sakit" },
  { value: "TUKAR_SHIFT", label: "Tukar Shift" },
];

export default function RequestForm() {
  const { user } = useAuth();
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [requestType, setRequestType] = useState(requestTypeOptions[0].value);

  const handleSubmit = async () => {
    if (!user?.id) {
      setStatus("error");
      return;
    }

    setStatus("submitting");
    const response = await fetch("/api/requests/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        type: requestType,
        startDate,
        endDate,
      }),
    });

    if (response.ok) {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
      return;
    }

    setStatus("error");
  };

  const getButtonText = () => {
    switch (status) {
      case "submitting":
        return "Mengirim...";
      case "success":
        return "Berhasil Terkirim!";
      case "error":
        return "Gagal Mengirim";
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
    if (status === "error") {
      return `${baseClasses} bg-error text-on-error`;
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
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="w-full bg-transparent text-body-md font-body-md outline-none"
              />
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
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="w-full bg-transparent text-body-md font-body-md outline-none"
              />
            </div>
          </div>
        </div>

        {/* Request Type */}
        <div className="flex flex-col gap-1">
          <label className="font-label text-label-xs text-on-surface-variant uppercase">
            Jenis Pengajuan
          </label>
          <select
            value={requestType}
            onChange={(event) => setRequestType(event.target.value)}
            className="w-full border border-outline-variant rounded px-2 py-2 bg-surface font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          >
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
