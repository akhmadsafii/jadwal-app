"use client";

import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminTopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    router.push("/login");
  };

  return (
    <header className="bg-surface w-full top-0 sticky flex justify-between items-center h-16 px-container-margin z-40 border-b border-outline-variant">
      <div className="flex items-center gap-3">
        <button className="cursor-pointer active:opacity-80 transition-opacity p-2 hover:bg-surface-container-low rounded-full">
          <span className="material-symbols-outlined text-primary">menu</span>
        </button>
        <h1 className="text-lg font-semibold text-primary">Admin: Input Jadwal</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-on-surface hidden sm:inline">{user?.name}</span>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant hover:opacity-80 transition-opacity"
          title="Logout"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-secondary p-1">person</span>
          )}
        </button>
      </div>
    </header>
  );
}