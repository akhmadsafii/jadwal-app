"use client";

import Link from "next/link";

export default function PublicTopBar() {
  return (
    <header className="bg-surface w-full top-0 sticky z-40 border-b border-outline-variant flex justify-between items-center h-16 px-container-margin">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-container rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-xl">schedule</span>
        </div>
        <h1 className="text-lg font-bold text-primary">Chronos Pro</h1>
      </div>
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]">login</span>
        Masuk
      </Link>
    </header>
  );
}