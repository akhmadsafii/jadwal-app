"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminTopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  return (
    <header className="bg-surface w-full top-0 sticky flex justify-between items-center h-16 px-container-margin z-40 border-b border-outline-variant">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-primary">Admin: Input Jadwal</h1>
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

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            {/* Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant overflow-hidden z-50">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-outline-variant">
                <p className="text-sm font-bold text-on-surface truncate">{user?.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{user?.position || user?.role}</p>
              </div>
              {/* Menu Items */}
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
    </header>
  );
}