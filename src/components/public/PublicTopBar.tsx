"use client";

import { userProfile } from "@/data/publicData";

export default function PublicTopBar() {
  return (
    <header className="fixed top-0 z-50 w-full bg-surface border-b border-outline-variant flex justify-between items-center px-container-margin h-14">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center overflow-hidden">
          <img
            alt={userProfile.name}
            className="w-full h-full object-cover"
            src={userProfile.imageUrl}
          />
        </div>
        <span className="text-lg font-bold text-primary">Chronos Pro</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="material-symbols-outlined text-primary hover:bg-surface-container-low transition-colors p-2 rounded-full">
          search
        </button>
      </div>
    </header>
  );
}