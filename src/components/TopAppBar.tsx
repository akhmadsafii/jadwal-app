"use client";

import { useAuth } from "@/lib/authContext";

export default function TopAppBar() {
  const { user } = useAuth();

  return (
    <header className="bg-surface w-full sticky top-0 z-40 border-b border-outline-variant flex justify-between items-center h-16 px-container-margin">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary cursor-pointer active:opacity-80 transition-opacity">
          menu
        </span>
        <h1 className="font-headline text-headline-md text-primary font-semibold">
          Pengajuan Jadwal
        </h1>
      </div>
      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden border border-outline-variant">
        {user?.avatarUrl ? (
          <img
            alt={user.name}
            className="w-full h-full object-cover"
            src={user.avatarUrl}
          />
        ) : (
          <span className="material-symbols-outlined text-primary text-[18px]">person</span>
        )}
      </div>
    </header>
  );
}
