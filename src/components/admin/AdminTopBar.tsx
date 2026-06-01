"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { adminNavItems } from "@/data/adminData";

const pageMeta = {
  "/admin": {
    title: "Input Jadwal",
    subtitle: "Kelola jadwal shift bulanan",
    icon: "edit_calendar",
    accent: "bg-primary-container text-on-primary-container",
  },
  "/admin/approval": {
    title: "Approval Requests",
    subtitle: "Setujui atau tolak pengajuan pegawai",
    icon: "task_alt",
    accent: "bg-secondary-container text-on-secondary-container",
  },
  "/admin/roster": {
    title: "Roster & Export",
    subtitle: "Pantau jadwal semua pegawai",
    icon: "calendar_view_month",
    accent: "bg-tertiary-container text-on-tertiary-container",
  },
  "/admin/users": {
    title: "Manage Users",
    subtitle: "Tambah dan edit user aplikasi",
    icon: "manage_accounts",
    accent: "bg-primary-container text-on-primary-container",
  },
  "/admin/profile": {
    title: "Profil Admin",
    subtitle: "Edit informasi akun admin",
    icon: "account_circle",
    accent: "bg-surface-container-high text-on-surface",
  },
  "/admin/password": {
    title: "Ganti Password",
    subtitle: "Perbarui keamanan akun",
    icon: "lock_reset",
    accent: "bg-error-container text-on-error-container",
  },
};

export default function AdminTopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const meta = pageMeta[pathname as keyof typeof pageMeta] || pageMeta["/admin"];

  const navItems = useMemo(() => {
    return adminNavItems.map((item) => ({
      ...item,
      isActive: pathname === item.href,
    }));
  }, [pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  return (
    <header className="bg-surface w-full top-0 sticky z-40 border-b border-outline-variant">
      <div className="h-16 px-container-margin flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.accent}`}>
            <span className="material-symbols-outlined text-[22px]">{meta.icon}</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-on-surface truncate">{meta.title}</h1>
            <p className="text-[11px] text-on-surface-variant truncate">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1 rounded-full bg-surface-container p-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold transition-colors ${
                  item.isActive
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-9 h-9 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant hover:opacity-80 transition-opacity"
              title="Profile"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-secondary flex items-center justify-center h-full">person</span>
              )}
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-outline-variant">
                    <p className="text-sm font-bold text-on-surface truncate">{user?.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user?.position || user?.role}</p>
                  </div>
                  <div className="p-2 grid grid-cols-2 gap-1 md:hidden">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMenu(false)}
                        className={`rounded-lg px-2 py-2 text-xs font-bold flex items-center gap-1.5 ${
                          item.isActive
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/admin/profile"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">edit</span>
                    <span className="text-sm text-on-surface">Edit Profile</span>
                  </Link>
                  <Link
                    href="/admin/password"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">lock_reset</span>
                    <span className="text-sm text-on-surface">Ganti Password</span>
                  </Link>
                  <div className="border-t border-outline-variant my-1" />
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-error-container/30 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[20px] text-error">logout</span>
                    <span className="text-sm text-error font-medium">{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
