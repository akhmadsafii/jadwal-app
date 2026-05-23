"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

export default function EmployeeTopBar() {
  const { user, logout, isDefaultPassword } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="bg-surface w-full top-0 sticky z-40 border-b border-outline-variant flex justify-between items-center h-16 px-container-margin">
      <div className="flex items-center gap-3">
        <Link href="/" className="p-2 hover:bg-surface-container-low rounded-full transition-opacity">
          <span className="material-symbols-outlined text-primary">menu</span>
        </Link>
        <h1 className="text-lg font-semibold text-primary">Pengajuan Jadwal</h1>
      </div>
      <div className="flex items-center gap-2">
        {isDefaultPassword && (
          <span className="text-[10px] bg-warning text-white px-2 py-1 rounded-full hidden sm:inline">
            Default Password
          </span>
        )}
        <span className="text-sm text-on-surface hidden sm:inline">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="w-8 h-8 rounded-full overflow-hidden bg-primary-container border border-outline-variant hover:opacity-80 transition-opacity"
          title="Logout"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-primary p-1">person</span>
          )}
        </button>
      </div>
    </header>
  );
}