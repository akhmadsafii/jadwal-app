"use client";

import { quickActions } from "@/data/adminData";

interface QuickActionsProps {
  onAutoFill?: () => void;
  onBulkCopy?: () => void;
  onClearAll?: () => void;
}

export default function QuickActions({
  onAutoFill,
  onBulkCopy,
  onClearAll,
}: QuickActionsProps) {
  const actions = [
    { ...quickActions[0], onClick: onAutoFill },
    { ...quickActions[1], onClick: onBulkCopy },
    { ...quickActions[2], onClick: onClearAll },
  ];

  return (
    <section className="px-container-margin grid grid-cols-3 gap-2">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          className={`flex flex-col items-center justify-center ${action.bg} ${action.textColor} py-3 rounded-xl active:scale-95 transition-transform border border-outline-variant`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {action.icon}
          </span>
          <span className="text-[10px] mt-1">{action.label}</span>
        </button>
      ))}
    </section>
  );
}