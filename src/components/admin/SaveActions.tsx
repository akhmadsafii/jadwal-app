"use client";

import { useState } from "react";
import { ShiftType } from "@/data/adminData";
import { useAuth } from "@/lib/authContext";

interface SaveActionsProps {
  schedule: Record<string, Record<string, ShiftType>>;
  month: number;
  year: number;
  onSaveSuccess?: (action: SaveAction) => void;
}

type ApiShiftType = "PAGI" | "MIDDLE" | "SIANG" | "MALAM" | "LIBUR" | "CUTI" | "SAKIT" | "TURUN";
type SaveAction = "draft" | "publish";

export default function SaveActions({ schedule, month, year, onSaveSuccess }: SaveActionsProps) {
  const { token } = useAuth();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [activeAction, setActiveAction] = useState<SaveAction | null>(null);
  const [message, setMessage] = useState("");

  const handleSave = async (action: SaveAction) => {
    setStatus("saving");
    setActiveAction(action);
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schedules, action, month, year }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(result.message || "Jadwal berhasil disimpan!");
        onSaveSuccess?.(action);
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

  return (
    <section className="px-container-margin mt-auto pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => handleSave("draft")}
          disabled={status === "saving" || !token}
          className="h-12 font-bold rounded-xl flex items-center justify-center gap-2 border border-primary text-primary bg-surface active:scale-95 transition-all disabled:opacity-50"
        >
          <span className={`material-symbols-outlined ${status === "saving" && activeAction === "draft" ? "animate-spin" : ""}`}>
            {status === "saving" && activeAction === "draft" ? "progress_activity" : "draft"}
          </span>
          {status === "saving" && activeAction === "draft" ? "Menyimpan..." : "Simpan Draft"}
        </button>
        <button
          onClick={() => handleSave("publish")}
          disabled={status === "saving" || !token}
          className="h-12 font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm bg-primary text-on-primary active:scale-95 transition-all disabled:opacity-50"
        >
          <span className={`material-symbols-outlined ${status === "saving" && activeAction === "publish" ? "animate-spin" : ""}`}>
            {status === "saving" && activeAction === "publish" ? "progress_activity" : "publish"}
          </span>
          {status === "saving" && activeAction === "publish" ? "Mempublish..." : "Simpan & Publish"}
        </button>
      </div>
      {message ? (
        <p className={`text-center text-xs mt-2 ${status === "error" ? "text-error" : "text-green-700"}`}>
          {message}
        </p>
      ) : (
        <p className="text-center text-[10px] text-outline mt-2">
          Draft hanya terlihat admin. Publish akan menampilkan jadwal kepada pegawai.
        </p>
      )}
    </section>
  );
}
