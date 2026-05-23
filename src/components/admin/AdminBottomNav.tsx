"use client";

import { adminNavItems } from "@/data/adminData";

export default function AdminBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-4 pb-6 bg-surface border-t border-outline-variant h-20 z-50 shadow-sm">
      {adminNavItems.map((item, idx) => (
        <button
          key={idx}
          className={`flex flex-col items-center justify-center px-5 py-1 transition-all scale-95 active:scale-90 duration-150 ${
            item.isActive
              ? "bg-secondary-container text-on-secondary-container rounded-full"
              : "text-on-surface-variant hover:bg-surface-container-high"
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={
              item.isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
            }
          >
            {item.icon}
          </span>
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}