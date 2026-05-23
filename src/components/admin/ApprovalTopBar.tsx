"use client";

import { adminProfile } from "@/data/adminData";

export default function ApprovalTopBar() {
  return (
    <header className="bg-surface w-full top-0 sticky flex justify-between items-center h-16 px-container-margin z-40 border-b border-outline-variant">
      <div className="flex items-center gap-3">
        <button className="cursor-pointer active:opacity-80 transition-opacity p-2 hover:bg-surface-container-low rounded-full">
          <span className="material-symbols-outlined text-primary">menu</span>
        </button>
        <h1 className="text-lg font-semibold text-primary">Approval Requests</h1>
      </div>
      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant">
        <img
          alt={adminProfile.name}
          className="w-full h-full object-cover"
          src={adminProfile.imageUrl}
        />
      </div>
    </header>
  );
}