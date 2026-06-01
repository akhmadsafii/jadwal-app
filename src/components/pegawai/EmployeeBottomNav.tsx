"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { employeeNavItems } from "@/data/employeeData";

export default function EmployeeBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-2 pb-6 bg-surface border-t border-outline-variant h-20 z-50 shadow-sm">
      {employeeNavItems.map((item, idx) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={idx}
            href={item.href}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-1 transition-transform duration-150 active:scale-90 ${
              isActive
                ? "bg-secondary-container text-on-secondary-container rounded-full scale-95"
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
