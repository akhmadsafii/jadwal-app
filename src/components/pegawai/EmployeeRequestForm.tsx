"use client";

import { useEffect, useState } from "react";
import { employeeRequestTypeOptions } from "@/data/employeeData";
import { useAuth } from "@/lib/authContext";
import { addDays, formatDateKey, getLocalDateKey } from "@/lib/dateKeys";

export default function EmployeeRequestForm() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<{
    type: string;
    startDate: string;
    endDate: string;
    swapWithUserName?: string;
    autoApproved?: boolean;
  } | null>(null);

  const today = new Date();
  const [startDate, setStartDate] = useState(getLocalDateKey(today));
  const [endDate, setEndDate] = useState(getLocalDateKey(addDays(today, 1)));
  const [requestType, setRequestType] = useState(employeeRequestTypeOptions[0].value);
  const [description, setDescription] = useState("");
  const [employees, setEmployees] = useState<{ id: string; name: string; nip: string; isActive?: boolean }[]>([]);
  const [swapWithUserId, setSwapWithUserId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const isDaySwapRequest = requestType === "TUKAR_HARI";
  const isEmployeeSwapRequest = requestType === "TUKAR_SHIFT";
  const selectedSwapUser = employees.find((employee) => employee.id === swapWithUserId);

  useEffect(() => {
    fetch("/api/users?role=EMPLOYEE")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const users = (data?.users || []).filter((employee: any) => (
          employee.id !== user?.id && employee.isActive !== false
        ));
        setEmployees(users);
        setSwapWithUserId((current) => current || users[0]?.id || "");
      })
      .catch(() => setEmployees([]));
  }, [user?.id]);

  const formatDisplayDate = (dateStr: string): string => {
    return formatDateKey(dateStr, {
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

  const validateBeforeSubmit = () => {
    if (!user?.id) {
      setStatus("error");
      setMessage("Sesi login tidak ditemukan. Silakan login ulang.");
      return false;
    }

    if (isEmployeeSwapRequest && !swapWithUserId) {
      setStatus("error");
      setMessage("Pilih karyawan tujuan untuk tukar shift.");
      return false;
    }

    if (isDaySwapRequest && startDate === endDate) {
      setStatus("error");
      setMessage("Pilih dua tanggal yang berbeda untuk tukar hari.");
      return false;
    }

    return true;
  };

  const openConfirm = () => {
    if (!validateBeforeSubmit()) return;
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    if (!validateBeforeSubmit()) return;
    const userId = user?.id;
    if (!userId) return;

    setShowConfirm(false);
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/requests/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: isDaySwapRequest ? "TUKAR_HARI" : requestType,
          startDate,
          endDate: isEmployeeSwapRequest ? startDate : endDate,
          swapWithUserId: isEmployeeSwapRequest ? swapWithUserId : undefined,
          description,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setSubmittedRequest({
          type: requestType,
          startDate,
          endDate: isEmployeeSwapRequest ? startDate : endDate,
          swapWithUserName: isEmployeeSwapRequest ? selectedSwapUser?.name : undefined,
          autoApproved: Boolean(data.autoApproved),
        });
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
            <h2 className="text-base font-bold text-green-900">
              {submittedRequest.autoApproved ? "Tukar shift berhasil" : "Pengajuan sudah terkirim"}
            </h2>
            <p className="text-sm text-green-800 mt-1">
              {requestTypeLabel} tanggal {formatDisplayDate(submittedRequest.startDate)}
              {submittedRequest.endDate !== submittedRequest.startDate
                ? ` - ${formatDisplayDate(submittedRequest.endDate)}`
                : ""}{" "}
              {submittedRequest.swapWithUserName ? `dengan ${submittedRequest.swapWithUserName} ` : ""}
              {submittedRequest.autoApproved ? "sudah langsung mengubah jadwal." : "sekarang menunggu approval admin."}
            </p>
            <div className="mt-3 inline-flex items-center gap-1 rounded bg-secondary-container px-2 py-1 text-[10px] font-bold text-on-secondary-container">
              <span className="material-symbols-outlined text-[14px]">
                {submittedRequest.autoApproved ? "published_with_changes" : "pending_actions"}
              </span>
              {submittedRequest.autoApproved ? "JADWAL SUDAH BERUBAH" : "MENUNGGU APPROVAL"}
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
    status === "submitting"
      ? (isEmployeeSwapRequest ? "Memproses..." : "Mengirim...")
      : status === "error"
        ? "Coba Kirim Lagi"
        : isEmployeeSwapRequest
          ? "Tukar Shift Sekarang"
          : isDaySwapRequest
            ? "Ajukan Tukar Hari"
          : "Kirim Pengajuan";

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
        <div className={`grid gap-3 ${isEmployeeSwapRequest ? "grid-cols-1" : "grid-cols-2"}`}>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="startDate">
              {isEmployeeSwapRequest ? "Tanggal Tukar Shift" : isDaySwapRequest ? "Tanggal Asal" : "Tanggal Mulai"}
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
                  if (isEmployeeSwapRequest || (!isDaySwapRequest && endDate < value)) setEndDate(value);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {!isEmployeeSwapRequest && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="endDate">
              {isDaySwapRequest ? "Tanggal Tujuan" : "Tanggal Selesai"}
            </label>
            <div className="relative flex items-center gap-2 border border-outline-variant rounded px-2 py-2 bg-surface hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px] text-secondary">event</span>
              <span className="text-sm text-on-surface">{formatDisplayDate(endDate)}</span>
              <input
                id="endDate"
                type="date"
                value={endDate}
                min={isDaySwapRequest ? undefined : startDate}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  clearFeedback();
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
          )}
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
                const value = event.target.value;
                setRequestType(value);
                if (value === "TUKAR_SHIFT") setEndDate(startDate);
                if (value === "TUKAR_HARI" && endDate === startDate) {
                  setEndDate(getLocalDateKey(addDays(new Date(), 1)));
                }
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

        {isEmployeeSwapRequest && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-on-surface-variant uppercase" htmlFor="swapWithUser">
              Tukar Dengan Karyawan
            </label>
            <div className="relative">
              <select
                id="swapWithUser"
                value={swapWithUserId}
                onChange={(event) => {
                  setSwapWithUserId(event.target.value);
                  clearFeedback();
                }}
                className="w-full border border-outline-variant rounded px-3 py-2.5 bg-surface text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none pr-10"
              >
                {employees.length === 0 ? (
                  <option value="">Tidak ada karyawan tersedia</option>
                ) : employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.nip}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-secondary pointer-events-none">
                expand_more
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant">
              Shift kamu pada tanggal ini akan langsung ditukar dengan shift karyawan tujuan.
            </p>
          </div>
        )}

        {isDaySwapRequest && (
          <div className="rounded-lg bg-secondary-container p-3 text-xs text-on-secondary-container">
            Pengajuan ini akan menukar isi jadwal di dua tanggal setelah disetujui admin.
          </div>
        )}

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
          onClick={openConfirm}
          disabled={status === "submitting"}
          className={`w-full h-12 text-base font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all ${
            status === "error" ? "bg-error text-on-error" : "bg-primary text-on-primary"
          } ${status === "submitting" ? "opacity-50" : ""}`}
        >
          {buttonText}
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[120] flex items-end bg-black/40 px-container-margin pb-6 sm:items-center sm:justify-center sm:p-6">
          <section className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-xl sm:max-w-md">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-container text-primary">
                <span className="material-symbols-outlined">
                  {isEmployeeSwapRequest ? "swap_horiz" : isDaySwapRequest ? "swap_calls" : "help_outline"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-on-surface">Konfirmasi pengajuan</h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Pastikan data berikut sudah benar sebelum dikirim.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-surface-container p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Jenis</span>
                <span className="text-right font-bold text-on-surface">
                  {employeeRequestTypeOptions.find((option) => option.value === requestType)?.label || requestType}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">Tanggal</span>
                <span className="text-right font-bold text-on-surface">
                  {formatDisplayDate(startDate)}
                  {!isEmployeeSwapRequest && endDate !== startDate ? ` - ${formatDisplayDate(endDate)}` : ""}
                </span>
              </div>
              {isEmployeeSwapRequest && (
                <div className="flex justify-between gap-3">
                  <span className="text-on-surface-variant">Tukar dengan</span>
                  <span className="text-right font-bold text-on-surface">
                    {selectedSwapUser?.name || "Karyawan tujuan"}
                  </span>
                </div>
              )}
            </div>

            <div className={`mt-3 rounded-lg p-3 text-xs ${
              isEmployeeSwapRequest
                ? "bg-warning/15 text-on-surface"
                : "bg-secondary-container text-on-secondary-container"
            }`}>
              {isEmployeeSwapRequest
                ? "Tukar shift akan langsung mengubah jadwal tanpa approval admin."
                : isDaySwapRequest
                  ? "Tukar hari akan masuk approval admin sebelum jadwal berubah."
                : "Pengajuan akan masuk ke daftar approval admin."}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="h-11 rounded-xl border border-outline-variant bg-surface text-sm font-bold text-on-surface"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="h-11 rounded-xl bg-primary text-sm font-bold text-on-primary"
              >
                Ya, Kirim
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
