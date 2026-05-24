"use client";

import { useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
}

interface EditProfileProps {
  onBack?: () => void;
}

export default function EditProfile({ onBack }: EditProfileProps) {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    position: user?.position || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Profil berhasil diperbarui!");
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
          onBack?.();
        }, 2000);
      } else {
        setStatus("error");
        setMessage(result.error || "Gagal menyimpan perubahan");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setMessage("Terjadi kesalahan koneksi");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getButtonClass = () => {
    const base = "w-full h-12 font-bold rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2";
    if (status === "success") {
      return `${base} bg-green-600 text-white`;
    }
    if (status === "error") {
      return `${base} bg-error text-on-error`;
    }
    if (status === "saving") {
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
    if (status === "saving") {
      return (
        <>
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Menyimpan...
        </>
      );
    }
    return "Simpan Perubahan";
  };

  return (
    <div className="max-w-xl mx-auto px-container-margin pt-8 pb-32">
      {/* Profile Header */}
      <section className="flex flex-col items-center mb-10">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-sm">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant">person</span>
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 bg-primary-container p-2.5 rounded-full text-on-primary-container shadow-md border-2 border-surface active:scale-95 transition-transform">
            <span className="material-symbols-outlined !text-[20px]">edit</span>
          </button>
        </div>
        <div className="mt-4 text-center">
          <h2 className="font-headline-md text-headline-md">{formData.name || user?.name}</h2>
          <p className="text-on-surface-variant">{formData.position || user?.position || user?.role}</p>
        </div>
      </section>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-label-sm text-on-surface-variant block ml-1" htmlFor="name">
            Nama Lengkap
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-label-sm text-on-surface-variant block ml-1" htmlFor="nip">
            NIP / ID Number
          </label>
          <div className="relative">
            <input
              id="nip"
              type="text"
              value={user?.nip || ""}
              disabled
              readOnly
              className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-variant/30 text-on-surface-variant/70 cursor-not-allowed pr-10"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40 !text-[18px]">lock</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-label-sm text-on-surface-variant block ml-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-label-sm text-on-surface-variant block ml-1" htmlFor="phone">
            No. Telepon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+62 xxx-xxxx-xxxx"
            className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-label-sm text-on-surface-variant block ml-1" htmlFor="position">
            Jabatan / Posisi
          </label>
          <div className="relative">
            <select
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full h-12 pl-4 pr-10 rounded-xl border border-outline-variant bg-surface-container-lowest appearance-none focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            >
              <option value="">Pilih Jabatan</option>
              <option value="Apoteker">Apoteker</option>
              <option value="Apoteker Supervisor">Apoteker Supervisor</option>
              <option value="Staff Farmasi">Staff Farmasi</option>
              <option value="Staff Gudang">Staff Gudang</option>
              <option value="Kasir Farmasi">Kasir Farmasi</option>
              <option value="Administrator">Administrator</option>
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 space-y-3">
          <button
            type="submit"
            disabled={status === "saving" || status === "success"}
            className={getButtonClass()}
          >
            {getButtonText()}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full h-12 text-primary font-medium rounded-xl hover:bg-surface-container transition-colors"
          >
            Batal
          </button>
        </div>

        {/* Logout */}
        <div className="pt-8 mt-8 border-t border-outline-variant/30">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-12 flex items-center justify-center gap-2 border border-error/20 bg-error-container/20 text-error font-medium rounded-xl hover:bg-error-container/40 transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined !text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </form>
    </div>
  );
}