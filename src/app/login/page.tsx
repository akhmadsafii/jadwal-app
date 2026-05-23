"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<"employee" | "admin">("employee");
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Redirect if already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/pegawai");
      }
    }
  }, [router]);

  const handleLogin = async () => {
    if (!nip || !password) {
      setError("NIP dan password harus diisi");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await login(nip, password, role === "admin");

    if (result.success) {
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/pegawai");
      }
    } else {
      setError(result.error || "Login gagal");
    }

    setIsLoading(false);
  };

  const handleResetPassword = async () => {
    if (!nip) {
      setError("NIP harus diisi untuk reset password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nip }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
      } else {
        setResetSuccess(true);
      }
    } catch {
      setError("Terjadi kesalahan koneksi");
    }

    setIsLoading(false);
  };

  if (showReset) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-container-margin">
        <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/login" className="p-2 hover:bg-surface-container rounded-full">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </Link>
            <h2 className="text-lg font-semibold text-on-surface">Reset Password</h2>
          </div>

          {resetSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 text-3xl">check</span>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Request Terkirim</h3>
              <p className="text-sm text-outline mb-6">
                Hubungi administrator untuk reset password atau gunakan token yang diberikan.
              </p>
              <button
                onClick={() => {
                  setShowReset(false);
                  setResetSuccess(false);
                }}
                className="w-full h-12 bg-primary text-on-primary rounded-xl font-semibold"
              >
                Kembali ke Login
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-outline mb-4">
                Masukkan NIP Anda untuk request reset password.
              </p>
              <input
                type="text"
                placeholder="Masukkan NIP"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface mb-4 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
              {error && <p className="text-error text-sm mb-4">{error}</p>}
              <button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="w-full h-12 bg-primary text-on-primary rounded-xl font-semibold disabled:opacity-50"
              >
                {isLoading ? "Memproses..." : "Kirim Request"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-container-margin">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-primary text-4xl">schedule</span>
        </div>
        <h1 className="text-2xl font-bold text-primary">ShiftMaster Pro</h1>
        <p className="text-sm text-outline mt-1">Sistem Manajemen Jadwal Shift</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-on-surface mb-4 text-center">
          Masuk dengan Akun
        </h2>

        {/* Role Selection */}
        <div className="space-y-3 mb-4">
          <button
            onClick={() => setRole("employee")}
            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
              role === "employee"
                ? "border-primary bg-primary-container"
                : "border-outline-variant bg-surface hover:bg-surface-container"
            }`}
          >
            <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">person</span>
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-on-surface">Pegawai</p>
              <p className="text-xs text-outline">Ajukan permintaan shift & lihat jadwal</p>
            </div>
            {role === "employee" && (
              <span className="material-symbols-outlined text-primary">check_circle</span>
            )}
          </button>

          <button
            onClick={() => setRole("admin")}
            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
              role === "admin"
                ? "border-primary bg-primary-container"
                : "border-outline-variant bg-surface hover:bg-surface-container"
            }`}
          >
            <div className="w-12 h-12 bg-tertiary-container rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">admin_panel_settings</span>
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-on-surface">Administrator</p>
              <p className="text-xs text-outline">Kelola jadwal & approval request</p>
            </div>
            {role === "admin" && (
              <span className="material-symbols-outlined text-primary">check_circle</span>
            )}
          </button>
        </div>

        {/* Login Form */}
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder={role === "admin" ? "Username (admin)" : "NIP (contoh: SM-88219)"}
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full h-12 px-4 border border-outline-variant rounded-xl bg-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          />
        </div>

        {error && <p className="text-error text-sm mb-4">{error}</p>}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={!nip || !password || isLoading || authLoading}
          className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 ${
            nip && password
              ? "bg-primary text-on-primary hover:opacity-90"
              : "bg-surface-container text-outline cursor-not-allowed"
          }`}
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Memproses...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">login</span>
              Masuk
            </>
          )}
        </button>

        {/* Forgot Password */}
        <button
          onClick={() => setShowReset(true)}
          className="w-full text-center text-sm text-primary mt-4 hover:underline"
        >
          Lupa password? Reset di sini
        </button>
      </div>

      {/* Back to Home */}
      <Link
        href="/"
        className="mt-6 text-sm text-outline hover:text-primary transition-colors"
      >
        ← Kembali ke Jadwal Publik
      </Link>

      {/* Footer */}
      <p className="text-xs text-outline mt-6 text-center">
        © 2026 ShiftMaster Pro<br />
        Seluruh hak cipta dilindungi
      </p>
    </div>
  );
}