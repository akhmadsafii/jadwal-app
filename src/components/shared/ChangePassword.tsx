"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

interface ChangePasswordProps {
  onBack?: () => void;
  isAdmin?: boolean;
}

export default function ChangePassword({ onBack, isAdmin = false }: ChangePasswordProps) {
  const { token } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePassword = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = () => {
    const { newPassword, confirmPassword } = formData;

    // Check length
    if (newPassword.length < 8) {
      return "Password minimal 8 karakter";
    }

    // Check complexity
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return "Password harus mengandung huruf besar, huruf kecil, dan angka";
    }

    // Check match
    if (newPassword !== confirmPassword) {
      return "Konfirmasi password tidak cocok";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePassword();
    if (validationError) {
      setStatus("error");
      setMessage(validationError);
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Password berhasil diperbarui!");
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
          onBack?.();
        }, 2000);
      } else {
        setStatus("error");
        setMessage(result.error || "Gagal memperbarui password");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setMessage("Terjadi kesalahan koneksi");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const getButtonClass = () => {
    const base = "w-full h-12 font-bold rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all";
    if (status === "success") {
      return `${base} bg-green-600 text-white`;
    }
    if (status === "error") {
      return `${base} bg-error text-on-error`;
    }
    if (status === "submitting") {
      return `${base} bg-primary text-on-primary opacity-50`;
    }
    return `${base} bg-primary text-on-primary hover:bg-primary/90`;
  };

  const getButtonText = () => {
    if (status === "success") {
      return (
        <>
          <span className="material-symbols-outlined">check_circle</span>
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
    if (status === "submitting") {
      return (
        <>
          <span className="material-symbols-outlined animate-spin">sync</span>
          Memperbarui...
        </>
      );
    }
    return (
      <>
        Update Password
        <span className="material-symbols-outlined">lock_reset</span>
      </>
    );
  };

  // Validation checks for UI
  const checks = {
    length: formData.newPassword.length >= 8,
    complex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword),
    match: formData.confirmPassword === formData.newPassword && formData.newPassword !== "",
  };

  return (
    <div className="max-w-lg mx-auto px-container-margin pb-32">
      <div className="mb-8">
        <h2 className="text-headline-lg font-semibold text-on-surface">Ganti Password</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Perbarui kata sandi Anda untuk menjaga keamanan akun tetap optimal.
        </p>
      </div>

      <section className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-on-surface-variant" htmlFor="currentPassword">
              Password Saat Ini
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                name="currentPassword"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-12 px-4 pr-12 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => togglePassword("current")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPasswords.current ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-on-surface-variant" htmlFor="newPassword">
              Password Baru
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-12 px-4 pr-12 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => togglePassword("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPasswords.new ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-on-surface-variant" htmlFor="confirmPassword">
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-12 px-4 pr-12 rounded-lg border border-outline-variant bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => togglePassword("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPasswords.confirm ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Security Checklist */}
          <div className="bg-surface-container-low p-4 rounded-lg space-y-2">
            <p className="text-xs font-bold text-on-surface mb-2">Petunjuk Keamanan:</p>
            <ul className="space-y-1.5">
              <li className={`flex items-center gap-2 text-xs transition-colors ${checks.length ? "text-primary" : "text-on-surface-variant"}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {checks.length ? "check_circle" : "circle"}
                </span>
                Minimal 8 karakter
              </li>
              <li className={`flex items-center gap-2 text-xs transition-colors ${checks.complex ? "text-primary" : "text-on-surface-variant"}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {checks.complex ? "check_circle" : "circle"}
                </span>
                Kombinasi huruf besar, kecil, dan angka
              </li>
              <li className={`flex items-center gap-2 text-xs transition-colors ${checks.match ? "text-primary" : "text-on-surface-variant"}`}>
                <span className="material-symbols-outlined text-[16px]">
                  {checks.match ? "check_circle" : "circle"}
                </span>
                Konfirmasi password harus cocok
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={status === "submitting" || status === "success"}
              className={getButtonClass()}
            >
              {getButtonText()}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full h-12 bg-transparent text-primary font-bold rounded-full border border-outline-variant hover:bg-surface-container transition-all"
            >
              Batal
            </button>
          </div>
        </form>
      </section>

      {/* Decorative Icon */}
      <div className="mt-12 flex justify-center opacity-40">
        <div className="relative w-24 h-24 rounded-full bg-primary-container/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-[64px] text-primary">verified_user</span>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">shield</span>
          </div>
        </div>
      </div>
    </div>
  );
}