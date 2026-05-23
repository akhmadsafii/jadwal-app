"use client";

import { currentMonth } from "@/data/publicData";

interface MonthSelectorProps {
  onPrev?: () => void;
  onNext?: () => void;
}

export default function MonthSelector({ onPrev, onNext }: MonthSelectorProps) {
  return (
    <section className="bg-surface-container-lowest px-container-margin py-4 border-b border-outline-variant flex items-center justify-between">
      <button
        onClick={onPrev}
        className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-1 rounded-lg"
      >
        chevron_left
      </button>
      <div className="text-center">
        <h1 className="text-lg font-semibold text-on-surface">
          {currentMonth.name} {currentMonth.year}
        </h1>
        <p className="text-xs text-outline uppercase tracking-wider">
          {currentMonth.subtitle}
        </p>
      </div>
      <button
        onClick={onNext}
        className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-1 rounded-lg"
      >
        chevron_right
      </button>
    </section>
  );
}