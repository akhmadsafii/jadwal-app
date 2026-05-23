"use client";

import { navItems } from "@/data/publicData";

export default function PublicBottomNav() {
  return (
    <nav className="fixed bottom-0 w-full z-50 h-[72px] bg-surface border-t border-outline-variant flex justify-around items-center pb-6 shadow-sm">
      {navItems.map((item, idx) => (
        <button
          key={idx}
          className={`flex flex-col items-center justify-center px-4 py-1 transition-all ${
            item.isActive
              ? "bg-primary-container text-on-primary-container rounded-full"
              : "text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={item.isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {item.icon}
          </span>
          <span className="text-xs">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}