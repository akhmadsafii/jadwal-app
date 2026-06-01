"use client";

import { useState } from "react";
import { employeeRequestTypeOptions } from "@/data/employeeData";
import { useAuth } from "@/lib/authContext";

export default function EmployeeRequestForm() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<{
    type: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  const today = new Date();
  const [startDate, setStartDate] = useState(today.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [requestType, setRequestType] = useState(employeeRequestTypeOptions[0].value);
  const [description, setDescription] = useState("");

  const formatDisplayDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const clearFeedback = () => {
    if (status === "error") {
      setStatus("idle");
      setMessage("");
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setStatus("error");
      setMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: requestType,
          startDate,
          endDate,
          description,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setSubmittedRequest({ type: requestType, startDate, endDate });
        setDescription("");
        window.dispatchEvent(new Event("employee-request-created"));
        return;
      }

      setStatus("error");
      setMessage(data.error || "Pengajuan gagal dikirim. Coba lagi.");
    } catch {
      setStatus("error");
      setMessage("Terjadi kesalahan koneksi. Coba lagi.");
    }
  };

  const resetForm = () => {
    setStatus("idle");
    setMessage("");
    setSubmittedRequest(null);
  };

  const requestTypeLabel =
    employeeRequestTypeOptions.find((option) => option.value === submittedRequest?.type)?.label ||
    submittedRequest?.type;

  if (status === "success" && submittedRequest) {
    return (
      <section className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-green-900">Pengajuan sudah terkirim</h2>
            <p className="text-sm text-green-800 mt-1">
              {requestTypeLabel} tanggal {formatDisplayDate(submittedRequest.startDate)}
              {submittedRequest.endDate !== submittedRequest.startDate
                ? ` - ${formatDisplayDate(submittedRequest.endDate)}`
                : ""}{" "}
              sekarang menunggu approval admin.
            </p>
            <div className="mt-3 inline-flex items-center gap-1 rounded bg-secondary-container px-2 py-1 text-[10px] font-bold text-on-secondary-container">
              <span className="material-symbols-outlined text-[14px]">pending_actions</span>
              MENUNGGU APPROVAL
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="mt-4 w-full h-11 rounded-xl bg-green-600 text-white font-bold active:scale-[0.98] transition-transform"
        >
          Buat Pengajuan Lain
        </button>
      </section>
    );
  }

  const buttonText =
    status === "submitting" ? "Mengirim..." : status === "error" ? "Coba Kirim Lagi" : "Kirim Pengajuan";

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
      <h2 className="text-xs text-primary uppercase tracking-wider mb-3 font-semibold">
        Buat Pengajuan Baru
      </h2>

      {status === "error" && message && (
        <div className="mb-3 rounded-lg border border-error/20 bg-error-container p-3 text-sm text-on-error-container">
          {message}
        </div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="startDate">
              Tanggal Mulai
            </label>
            <div className="relative flex items-center gap-2 border border-outline-variant rounded px-2 py-2 bg-surface hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px] text-secondary">calendar_today</span>
              <span className="text-sm text-on-surface">{formatDisplayDate(startDate)}</span>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => {
                  const value = event.target.value;
                  setStartDate(value);
                  clearFeedback();
                  if (endDate < value) setEndDate(value);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="endDate">
              Tanggal Selesai
            </label>
            <div className="relative flex items-center gap-2 border border-outline-variant rounded px-2 py-2 bg-surface hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px] text-secondary">event</span>
              <span className="text-sm text-on-surface">{formatDisplayDate(endDate)}</span>
              <input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  clearFeedback();
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="requestType">
            Jenis Pengajuan
          </label>
          <div className="relative">
            <select
              id="requestType"
              value={requestType}
              onChange={(event) => {
                setRequestType(event.target.value);
                clearFeedback();
              }}
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

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="description">
            Keterangan (Opsional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tambahkan keterangan jika diperlukan..."
            className="w-full border border-outline-variant rounded px-3 py-2.5 bg-surface text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={status === "submitting"}
          className={`w-full h-12 text-base font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all ${
            status === "error" ? "bg-error text-on-error" : "bg-primary text-on-primary"
          } ${status === "submitting" ? "opacity-50" : ""}`}
        >
          {buttonText}
        </button>
      </div>
    </section>
  );
}
