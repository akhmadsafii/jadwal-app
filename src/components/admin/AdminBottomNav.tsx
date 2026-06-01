"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavItems } from "@/data/adminData";

export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-2 pb-6 bg-surface border-t border-outline-variant h-20 z-50 shadow-sm">
      {adminNavItems.map((item, idx) => {
        const href = item.href;
        const isActive = pathname === href || (item.label === "Roster" && pathname === "/admin/roster");

        return (
          <Link
            key={idx}
            href={href}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-1 transition-all scale-95 active:scale-90 duration-150 ${
              isActive
                ? "bg-secondary-container text-on-secondary-container rounded-full"
                : "text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[11px] leading-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
