"use client";

import { useState } from "react";
import { ShiftType } from "@/data/adminData";

interface SaveActionsProps {
  schedule: Record<string, Record<string, ShiftType>>;
  onPublishSuccess?: () => void;
}

type ApiShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";

export default function SaveActions({ schedule, onPublishSuccess }: SaveActionsProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handlePublish = async () => {
    setStatus("saving");
    setMessage("");

    try {
      // Convert schedule to API format
      const schedules: { userId: string; date: string; shiftType: ApiShiftType }[] = [];

      Object.entries(schedule).forEach(([staffId, dateShifts]) => {
        Object.entries(dateShifts).forEach(([dateKey, shiftType]) => {
          schedules.push({
            userId: staffId,
            date: dateKey,
            shiftType: shiftType as ApiShiftType,
          });
        });
      });

      if (schedules.length === 0) {
        setStatus("error");
        setMessage("Tidak ada jadwal untuk disimpan");
        setTimeout(() => setStatus("idle"), 3000);
        return;
      }

      const response = await fetch("/api/schedules/bulk-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(result.message || "Jadwal berhasil disimpan!");
        onPublishSuccess?.();
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setMessage(result.error || "Gagal menyimpan jadwal");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Publish error:", error);
      setStatus("error");
      setMessage("Terjadi kesalahan koneksi");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const getButtonClasses = () => {
    const base = "w-full h-12 font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all";
    if (status === "success") {
      return `${base} bg-green-600 text-white`;
    }
    if (status === "error") {
      return `${base} bg-error text-on-error`;
    }
    if (status === "saving") {
      return `${base} bg-primary text-on-primary opacity-50`;
    }
    return `${base} bg-primary text-on-primary`;
  };

  const getButtonText = () => {
    if (status === "success") {
      return (
        <>
          <span className="material-symbols-outlined">check</span>
          {message}
        </>
      );
    }
    if (status === "error") {
      return (
        <>
          <span className="material-symbols-outlined">error</span>
          {message}
        </>
      );
    }
    if (status === "saving") {
      return (
        <>
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Menyimpan...
        </>
      );
    }
    return (
      <>
        <span className="material-symbols-outlined">save</span>
        Simpan & Publish Jadwal
      </>
    );
  };

  return (
    <section className="px-container-margin mt-auto pt-4">
      <button
        onClick={handlePublish}
        disabled={status === "saving"}
        className={getButtonClasses()}
      >
        {getButtonText()}
      </button>
      <p className="text-center text-[10px] text-outline mt-2">
        Jadwal akan langsung tersedia untuk pegawai setelah disimpan
      </p>
    </section>
  );
}
