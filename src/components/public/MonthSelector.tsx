"use client";

import { useState, useEffect } from "react";
import { getCurrentMonthInfo } from "@/data/publicData";

interface MonthSelectorProps {
  onMonthChange?: (month: number, year: number) => void;
}

export default function MonthSelector({ onMonthChange }: MonthSelectorProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthInfo, setMonthInfo] = useState(getCurrentMonthInfo(new Date()));

  useEffect(() => {
    setMonthInfo(getCurrentMonthInfo(currentDate));
    onMonthChange?.(currentDate.getMonth() + 1, currentDate.getFullYear());
  }, [currentDate, onMonthChange]);

  const goToPrevMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getFullYear() === now.getFullYear()
    );
  };

  return (
    <section className="bg-surface-container-lowest px-container-margin py-4 border-b border-outline-variant flex items-center justify-between">
      <button
        onClick={goToPrevMonth}
        className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-2 rounded-lg active:scale-90 transition-all"
        aria-label="Previous month"
      >
        chevron_left
      </button>
      <div className="text-center min-w-40">
        <h1 className="text-lg font-semibold text-on-surface">
          {monthInfo.name} {monthInfo.year}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1">
          <p className="text-xs text-outline uppercase tracking-wider">
            {monthInfo.subtitle}
          </p>
          {!isCurrentMonth() && (
            <button
              onClick={goToCurrentMonth}
              className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
            >
              Bulan ini
            </button>
          )}
        </div>
      </div>
      <button
        onClick={goToNextMonth}
        className="material-symbols-outlined text-secondary hover:bg-surface-container-low p-2 rounded-lg active:scale-90 transition-all"
        aria-label="Next month"
      >
        chevron_right
      </button>
    </section>
  );
}