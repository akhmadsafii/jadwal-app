"use client";

const navItems = [
  { icon: "admin_panel_settings", label: "Admin" },
  { icon: "event_note", label: "Requests", isActive: true },
  { icon: "calendar_view_month", label: "Roster" },
];

export default function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-4 pb-6 bg-surface border-t border-outline-variant h-20 z-50 shadow-sm">
      {navItems.map((item, index) => (
        <button
          key={index}
          className={`flex flex-col items-center justify-center px-5 py-1 transition-transform duration-150 active:scale-90 ${
            item.isActive
              ? "bg-secondary-container text-on-secondary-container rounded-full scale-95"
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
          <span className="font-label text-label-sm">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
